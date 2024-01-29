window.screens = window.screens || {};
var path = window.core.getPath('reportspage.js');

window.screens['reports'] = {
    'menu_weight':51,
    'menu_name':'Reports',
    'get_args':function(){
    },
    'menu_icon': '<i class="fa fa-file-text" aria-hidden="true"></i>',
    'html': path+'reportspage.html',
    'css':[path+'reportspage.css',
	path+'../../common/VXGActivity/VXGActivityCollection.css',
    ],
    'stablecss':[
    ],
    'commoncss':[
	'VXGActivity/VXGActivity.css'
    ],
    'commonjs':[
	'VXGActivity/VXGActivity.js'
    ],
    'js': [
    ],
    'on_search':function(text){
    },
    'on_before_show':function(r){
        return defaultPromise();
    },
    'on_show':function(r){
        if (core.elements['header-search']) core.elements['header-search'].find('input').val(this.search_text ? this.search_text : '');
        return defaultPromise();
    },
    'on_hide':function(){
    },

    'on_ready':function(){
        let self = this;
        core.elements['header-right'].prepend(`<div class="reportsfilterContainer">
													<div class="transparent-button reportsfilter">
														<span id="reportsfilter-btn"> Generate Reports </span>
													</div>
												</div>`);
        
        $('.filterDialog').click(function(e){
            let el = document.elementFromPoint(e.pageX, e.pageY);
            if ($('.filterDialog')[0]!==el) return;
            $(this).hide();
        });

        $(".show-report-filter").click(function() {
            self.show_reports_filter();
        })

        core.elements['header-right'].find('.reportsfilterContainer .reportsfilter').click(function(){
           self.show_reports_filter();
        })
        
        var timeNow = new Date();
        var minus24Hours = new Date();
        minus24Hours.setMinutes(minus24Hours.getMinutes() - minus24Hours.getTimezoneOffset() - (24 * 60));
        timeNow.setMinutes(timeNow.getMinutes() - timeNow.getTimezoneOffset());

        $("#startTimeFilter").val(minus24Hours.toISOString().slice(0,16));
        $("#endTimeFilter").val(timeNow.toISOString().slice(0,16));

        $("#generateReport").click(function() {
            var args = {'include_meta':true,'order_by':'-time'};
            var meta = "";
            var meta_not = "";

            var chosenCameraEles = $(".chosenCamera");
            var cameraIds = [];
            if (chosenCameraEles) {
                chosenCameraEles.each(function() {
                    var id = $(this).attr("camid");
                    cameraIds.push(id);
                })
            }
            if (cameraIds.length > 0) args.camid = cameraIds.join(",");

            var userIdStr = $("#userid").val();
            var userId = userIdStr ? userIdStr.replaceAll("@", "_AT_").replaceAll(".", "_DOT_") : null;
            if (userId) meta = "user_" + userId;

            var statuses = [];
            if ($("[name='not_handled']").is(':checked')) statuses.push($("[name='not_handled']").val());
            if ($("[name='in_progress']").is(':checked')) statuses.push($("[name='in_progress']").val());
            if ($("[name='processed']").is(':checked')) statuses.push($("[name='processed']").val());
            if (statuses.includes("status_not_handled")) {
                if (statuses.includes("status_processed") && !statuses.includes("status_in_progress"))
                    meta_not = "status_in_progress";
                else if (statuses.includes("status_in_progress") && !statuses.includes("status_processed"))
                    meta_not = "status_processed";
                else if (!statuses.includes("status_in_progress") && !statuses.includes("status_processed"))
                    meta_not = "status_in_progress,status_processed";
            } else if (statuses) {
                meta += meta ? "," + statuses.join(",") : statuses.join(",");
            }

            var onlyTrueResults = $("[name='result_true']").is(':checked') ? true : false;
            if (onlyTrueResults) meta += meta ? ",result_true" : "result_true";

            var startTimeStr = $("#startTimeFilter").val();
            var endTimeStr = $("#endTimeFilter").val();

            var startTime = startTimeStr ? new Date(startTimeStr).toISOString() : null;
            var endTime = endTimeStr ? new Date(endTimeStr).toISOString() : null;
            var now = new Date().toISOString();

            if (startTime && startTime > endTime) {
                $(".error-message").empty();
                $(".error-message").text("Start time must be before end time");
                $(".error-message").show();
                $("#startTimeFilter").css("background-color", "#ffcece");
                setTimeout(function() {
                    $(".error-message").hide();
                    $("#startTimeFilter").css("background-color", "white");
                }, 5000)
            }
            if (startTime && startTime > now) {
                $(".error-message").empty();
                $(".error-message").text("Start time must be before current time");
                $(".error-message").show();
                $("#startTimeFilter").css("background-color", "#ffcece");
                setTimeout(function() {
                    $(".error-message").hide();
                    $("#startTimeFilter").css("background-color", "white");
                }, 5000)
            }

            if (endTime && endTime > now) endTime = now; 

            if (startTime) args.start = startTime;
            if (endTime) args.end = endTime;
            if (meta) args.meta = meta;
            if (meta_not) args.meta_not = meta_not

            sessionStorage.setItem("event_report_args", args);
            core.elements['global-loader'].show();
            
            vxg.api.cloud.getEventslist(vxg.api.cloud.allCamsToken, 200, undefined, args).then(function(ret) {
                var events = ret.objects;
                $(".reportslist").removeClass("noreports");
                $(".reportslist").empty();
                var eventsTable = `
                        <button class="vxgbutton-transparent download-report" onClick="downloadReport('reportsTable')">Download Report as CSV</button>
                        <table id="reportsTable">
                            <tr>
                                <th>Event ID</th>
                                <th>Event Time</th>
                                <th>Processing Status</th>
                                <th>Started</th>
                                <th>Completed</th>
                                <th>Result</th>
                                <th>Description</th>
                                <th>User Email</th>
                                <th>User IP</th>
                            </tr>
                `;

                events.forEach(event => {
                    
                    var status = "Not Handled";
                    if (event.meta && event.meta.process) {
                        if (event.meta.process == "in_progress") status = "In Progress";
                        if (event.meta.process == "processed") status = "Processed";
                    }

                    var startTime = event.meta && event.meta.start_time ? new Date(event.meta.start_time).toLocaleString().replace(",", "") : "Not Started";
                    var endTime = event.meta && event.meta.end_time ? new Date(event.meta.end_time).toLocaleString().replace(",", "") : "Not Completed";
                    
                    var result = event.meta && event.meta.result ? event.meta.result : "No Result";
                    var description = event.meta && event.meta.description ? event.meta.description : "No Description";

                    var user_id = event.meta && event.meta.user_id ? event.meta.user_id.replaceAll("_AT_", "@").replaceAll("_DOT_", ".") : "No User Assigned";
                    var user_ip = event.meta && event.meta.ip_address ? event.meta.ip_address : "No User Assigned";

                    eventsTable += `
                        <tr>
                            <td>${event.id}</td>
                            <td>${new Date(event.time + "Z").toLocaleString().replace(",", "")}</td>
                            <td>${status}</td>
                            <td>${startTime}</td>
                            <td>${endTime}</td>
                            <td>${result}</td>
                            <td>${description}</td>
                            <td>${user_id}</td>
                            <td>${user_ip}</td>
                        </tr>
                    `;
                });

                eventsTable += "</table>";
                $(".reportslist").append(eventsTable);
                core.elements['global-loader'].hide();
                $('.filterDialog').hide();

            }, function(err) {
                core.elements['global-loader'].hide();
                console.log(err.responseText);
            });

        });
    },
    'on_init':function(){
        return defaultPromise();
    }, 
    'show_reports_filter':function() {
        var cameraNameIds = [];

        var cahcedCameras = localStorage.cameraList;
        if (cahcedCameras) {
            JSON.parse(cahcedCameras).objects.forEach(cam => {
                cameraNameIds.push(cam.name + " - " + cam.id);
            });
        }
        
        $( "#cameraIds" ).autocomplete({
            source: cameraNameIds,
            minLength: 0,
            autoFocus: true,
            select: function( event, ui ) {
                var nameId = ui.item.value.split(" - ");
                var chosenCameraEle = `<span class="chosenCamera" id="chosenCam${nameId[1]}" onClick="remove_element(${nameId[1]})" camid="${nameId[1]}">${nameId[0]}</span>`;
                $(".chosenCameraList").append(chosenCameraEle);
            }
          }).focus(function() {
            $(this).autocomplete('search', $(this).val())
        });

        $('.filterDialog').show();
    }
};

function remove_element(camid) {
    $("#chosenCam" + camid).remove();
}

function downloadReport(tableId) {
    var titles = [];
    var data = [];
  
    $('#' + tableId + ' th').each(function() {
      titles.push($(this).text());
    });
  
    $('#' + tableId + ' td').each(function() {
      data.push($(this).text());
    });
    
    var CSVString = prepCSVRow(titles, titles.length, '');
    CSVString = prepCSVRow(data, titles.length, CSVString);
  
    var downloadLink = document.createElement("a");
    var blob = new Blob(["\ufeff", CSVString]);
    var url = URL.createObjectURL(blob);
    downloadLink.href = url;
    var reportName = new Date();
    reportName.setMinutes(reportName.getMinutes() - reportName.getTimezoneOffset());
    downloadLink.download = reportName.toISOString() + ".csv";
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
}
  

function prepCSVRow(arr, columnCount, initial) {
    var row = '';
    function splitArray(_arr, _count) {
      var split = [];
      var result = [];
      _arr.forEach(function(item, idx) {
        if ((idx + 1) % _count === 0) {
            split.push(item);
            result.push(split);
            split = [];
        } else {
            split.push(item);
        }
      });
      return result;
    }

    var plainArr = splitArray(arr, columnCount);
    plainArr.forEach(function(arrItem) {
      arrItem.forEach(function(item, idx) {
        row += item + ((idx + 1) === arrItem.length ? '' : ",");
      });
      row += '\r\n';
    });
    return initial + row;
}
