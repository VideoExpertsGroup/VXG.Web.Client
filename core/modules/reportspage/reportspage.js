window.screens = window.screens || {};
var path = window.core.getPath('reportspage.js');

window.screens['reports'] = {
    'menu_weight':51,
    'menu_name': $.t('reports.title'),
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
														<span class="report-type" id="event_reportsfilter_btn" data-i18n="reports.events.title"> ${$.t('reports.events.title')} </span>
														<span class="report-type" id="camera_reportsfilter_btn" data-i18n="reports.operation.headerTitle" > ${$.t('reports.operation.headerTitle')} </span>
														<span class="report-type" id="access_reportsfilter_btn" data-i18n="reports.access.title"> ${$.t('reports.access.title')} </span>
													</div>
												</div>`);
        
        $('.filterDialog').click(function(e){
            let el = document.elementFromPoint(e.pageX, e.pageY);
            if (!$(el).hasClass("filterDialog")) return;
            $(this).hide();
        });

        $(".show-event-report-filter").click(function() {
            self.show_reports_filter("event");
        })
        core.elements['header-right'].find('.reportsfilterContainer .reportsfilter #event_reportsfilter_btn').click(function(){
           self.show_reports_filter("event");
        })

        $(".show-camera-report-filter").click(function() {
            self.show_reports_filter("op");
        })
        core.elements['header-right'].find('.reportsfilterContainer .reportsfilter #camera_reportsfilter_btn').click(function(){
           self.show_reports_filter("op");
        })

        $(".show-access-report-filter").click(function() {
            self.open_access_reports();
        })
        core.elements['header-right'].find('.reportsfilterContainer .reportsfilter #access_reportsfilter_btn').click(function(){
            self.open_access_reports();
        })
        
        var timeNow = new Date();
        var minus24Hours = new Date();
        minus24Hours.setMinutes(minus24Hours.getMinutes() - minus24Hours.getTimezoneOffset() - (24 * 60));
        timeNow.setMinutes(timeNow.getMinutes() - timeNow.getTimezoneOffset());

        $("#startTimeFilter").val(minus24Hours.toISOString().slice(0,16));
        $("#endTimeFilter").val(timeNow.toISOString().slice(0,16));
        $("#opStartTimeFilter").val(minus24Hours.toISOString().slice(0,16));
        $("#opEndTimeFilter").val(timeNow.toISOString().slice(0,16));

        $("#generateEventReport").click(function() {
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
                $(".error-message").text($.t('toast.startTimeMustBeBeforeEndTime'));
                $(".error-message").show();
                $("#startTimeFilter").css("background-color", "#ffcece");
                setTimeout(function() {
                    $(".error-message").hide();
                    $("#startTimeFilter").css("background-color", "white");
                }, 5000)
            }
            if (startTime && startTime > now) {
                $(".error-message").empty();
                $(".error-message").text($.t('toast.startTimeMustBeBeforeCurrentTime'));
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
                        <button class="vxgbutton-transparent download-report" onClick="downloadReport('reportsTable')">${$.t('action.downloadReportAsCsv')}</button>
                        <table id="reportsTable">
                            <tr>
                                <th>${$.t('common.eventID')}</th>
                                <th>${$.t('common.eventTime')}</th>
                                <th>${$.t('common.precessingStatus')}</th>
                                <th>${$.t('common.started')}</th>
                                <th>${$.t('common.completed')}</th>
                                <th>${$.t('common.result')}</th>
                                <th>${$.t('common.description')}</th>
                                <th>${$.t('common.userEmail')}</th>
                                <th>${$.t('common.userIp')}</th>
                            </tr>
                `;

                events.forEach(event => {
                    
                    var status = $.t('common.eventStatuses.notHandled');
                    if (event.meta && event.meta.process) {
                        if (event.meta.process == "in_progress") status = $.t('common.eventStatuses.inProgress');
                        if (event.meta.process == "processed") status = $.t('common.eventStatuses.precessed');
                    }

                    var startTime = event.meta && event.meta.start_time ? new Date(event.meta.start_time).toLocaleString().replace(",", "") : $.t('common.eventStatuses.notStarted');
                    var endTime = event.meta && event.meta.end_time ? new Date(event.meta.end_time).toLocaleString().replace(",", "") : $.t('common.eventStatuses.notCompleted');
                    
                    var result = event.meta && event.meta.result ? event.meta.result : $.t('reports.noResult');
                    var description = event.meta && event.meta.description ? event.meta.description : $.t('reports.noDescription');

                    var user_id = event.meta && event.meta.user_id ? event.meta.user_id.replaceAll("_AT_", "@").replaceAll("_DOT_", ".") : $.t('reports.notUserAssigned');
                    var user_ip = event.meta && event.meta.ip_address ? event.meta.ip_address : $.t('reports.notUserAssigned');

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

        $("#generateCameraReport").click(function() {
            // var args = {'include_meta':true,'order_by':'-time'};
            var args = {'order_by':'-time'};
            var operations = "";
            // var meta_not = "";

            var chosenCameraEles = $(".opChosenCamera");
            var cameraIds = [];
            if (chosenCameraEles) {
                chosenCameraEles.each(function() {
                    var id = $(this).attr("camid");
                    cameraIds.push(id);
                })
            }
            if (cameraIds.length > 0) args.camids = cameraIds.join(",");

            // var userIdStr = $("#userid").val();
            // var userId = userIdStr ? userIdStr.replaceAll("@", "_AT_").replaceAll(".", "_DOT_") : null;
            // if (userId) meta = "user_" + userId;

            var statuses = [];
            // if ($("[name='not_handled']").is(':checked')) statuses.push($("[name='not_handled']").val());
            // if ($("[name='in_progress']").is(':checked')) statuses.push($("[name='in_progress']").val());
            // if ($("[name='processed']").is(':checked')) statuses.push($("[name='processed']").val());
            // if (statuses.includes("status_not_handled")) {
            //     if (statuses.includes("status_processed") && !statuses.includes("status_in_progress"))
            //         meta_not = "status_in_progress";
            //     else if (statuses.includes("status_in_progress") && !statuses.includes("status_processed"))
            //         meta_not = "status_processed";
            //     else if (!statuses.includes("status_in_progress") && !statuses.includes("status_processed"))
            //         meta_not = "status_in_progress,status_processed";
            // } else if (statuses) {
            //     meta += meta ? "," + statuses.join(",") : statuses.join(",");
            // }
            // create_camera, delete_camera, update_camera, ptz_camera, update_media_stream, update_osd, update_video, update_video_stream, update_audio, update_audio_stream
            if ($("[name='create_camera']").is(':checked')) statuses.push($("[name='create_camera']").val());
            if ($("[name='delete_camera']").is(':checked')) statuses.push($("[name='delete_camera']").val());
            if ($("[name='update_camera']").is(':checked')) statuses.push($("[name='update_camera']").val());
            if ($("[name='ptz_camera']").is(':checked')) statuses.push($("[name='ptz_camera']").val());
            if ($("[name='update_media_stream']").is(':checked')) statuses.push($("[name='update_media_stream']").val());
            if ($("[name='update_osd']").is(':checked')) statuses.push($("[name='update_osd']").val());
            if ($("[name='update_video']").is(':checked')) statuses.push($("[name='update_video']").val());
            if ($("[name='update_video_stream']").is(':checked')) statuses.push($("[name='update_video_stream']").val());
            if ($("[name='update_audio']").is(':checked')) statuses.push($("[name='update_audio']").val());
            if ($("[name='update_audio_stream']").is(':checked')) statuses.push($("[name='update_audio_stream']").val());
            if (statuses) {
                operations += operations ? "," + statuses.join(",") : statuses.join(",");
            }

            // var onlyTrueResults = $("[name='result_true']").is(':checked') ? true : false;
            // if (onlyTrueResults) meta += meta ? ",result_true" : "result_true";

            var startTimeStr = $("#opStartTimeFilter").val();
            var endTimeStr = $("#opEndTimeFilter").val();

            var startTime = startTimeStr ? new Date(startTimeStr).toISOString() : null;
            var endTime = endTimeStr ? new Date(endTimeStr).toISOString() : null;
            var now = new Date().toISOString();

            if (startTime && startTime > endTime) {
                $(".error-message").empty();
                $(".error-message").text("Start time must be before end time");
                $(".error-message").show();
                $("#opStartTimeFilter").css("background-color", "#ffcece");
                setTimeout(function() {
                    $(".error-message").hide();
                    $("#opStartTimeFilter").css("background-color", "white");
                }, 5000)
            }
            if (startTime && startTime > now) {
                $(".error-message").empty();
                $(".error-message").text("Start time must be before current time");
                $(".error-message").show();
                $("#opStartTimeFilter").css("background-color", "#ffcece");
                setTimeout(function() {
                    $(".error-message").hide();
                    $("#opStartTimeFilter").css("background-color", "white");
                }, 5000)
            }

            if (endTime && endTime > now) endTime = now; 

            if (startTime) args.start = startTime;
            if (endTime) args.end = endTime;
            if (operations) args.operations = operations;
            // if (meta_not) args.meta_not = meta_not

            sessionStorage.setItem("event_report_args", args); // maybe change event_report_args
            core.elements['global-loader'].show();
            
            vxg.api.cloudone.license().then(function(response){
                var lkey = response.data;
                vxg.api.cloud.getCameraLogsFilter(lkey, vxg.api.cloud.allCamsToken, 200, undefined, args).then(function(ret) {
                    var events = ret.objects;
                    $(".reportslist").removeClass("noreports");
                    $(".reportslist").empty();
                    var eventsTable = `
                            <button class="vxgbutton-transparent download-report" onClick="downloadReport('reportsTable')">${$.t('reports.downloadReport')}</button>
                            <table id="reportsTable">
                                <tr>
                                    <th>Operation ID</th>
                                    <th>Camera ID</th>
                                    <th>Owner ID</th>
                                    <th>Time</th>
                                    <th>Operation Type</th>
                                    <th>Operation Data</th>
                                </tr>
                    `;

                    events.forEach(event => {
                        
                        // var status = "Not Handled";
                        // if (event.meta && event.meta.process) {
                        //     if (event.meta.process == "in_progress") status = "In Progress";
                        //     if (event.meta.process == "processed") status = "Processed";
                        // }

                        // var startTime = event.meta && event.meta.start_time ? new Date(event.meta.start_time).toLocaleString().replace(",", "") : "Not Started";
                        // var endTime = event.meta && event.meta.end_time ? new Date(event.meta.end_time).toLocaleString().replace(",", "") : "Not Completed";
                        
                        // var result = event.meta && event.meta.result ? event.meta.result : "No Result";
                        // var description = event.meta && event.meta.description ? event.meta.description : "No Description";

                        // var user_id = event.meta && event.meta.user_id ? event.meta.user_id.replaceAll("_AT_", "@").replaceAll("_DOT_", ".") : "No User Assigned";
                        // var user_ip = event.meta && event.meta.ip_address ? event.meta.ip_address : "No User Assigned";
                        
                        var operation_id = event._id;
                        var cam_id = event._source.cam_id;
                        var owner_id = event._source.owner_id;
                        var operation_time = new Date(event._source.created).toLocaleString().replace(",", "");
                        var operation_type = event._source.operation;
                        var operation_data = JSON.stringify(event._source.operation_data); // .toLocaleString();

                        eventsTable += `
                            <tr>
                                <td>${operation_id}</td>
                                <td>${cam_id}</td>
                                <td>${owner_id}</td>
                                <td>${operation_time}</td>
                                <td>${operation_type}</td>
                                <td>${operation_data}</td>
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
        });
    },
    'on_init':function(){
        return defaultPromise();
    }, 
    'show_reports_filter':function(reportType) {
        var self = this;
        var cameraNameIds = [];

        var cachedCameras = localStorage.cameraList;
        if (cachedCameras) {
            JSON.parse(cachedCameras).objects.forEach(cam => {
                cameraNameIds.push(cam.name + " - " + cam.id);
            });
            self.create_autocomplete(cameraNameIds, reportType, self);
        } else {
            return vxg.cameras.getFullCameraList(500,0).then(function(fullList) {
                var cameras = fullList.filter(cam => {if (cam.src.meta) return cam.src.meta.gateway == undefined; else return cam;});
                cameras.forEach(cam => {
                    cameraNameIds.push(cam.src.name + " - " + cam.src.id);
                });
                self.create_autocomplete(cameraNameIds, reportType, self);
            })
        }
    },
    'create_autocomplete': function(cameraNameIds, reportType, self) {
        $( "#"+reportType+"CameraIds" ).autocomplete({
            source: cameraNameIds,
            minLength: 0,
            autoFocus: true,
            select: function( event, ui ) {
                var nameId = ui.item.value.split(" - ");
                var chosenCameraEle = `<span class="chosenCamera" id="${reportType}ChosenCam${nameId[1]}" onClick="remove_element(${nameId[1]}, '${reportType}')" camid="${nameId[1]}">${nameId[0]}</span>`;
                $("."+reportType+"ChosenCameraList").append(chosenCameraEle);
            }
          }).focus(function() {
            $(this).autocomplete('search', $(this).val())
        });

        $('.'+reportType+'Dialog').show();
    },
    'open_access_reports': function() {
        if (sessionStorage.access_reports) window.open(sessionStorage.access_reports, '_blank');
        else {
            core.elements['global-loader'].show();
            vxg.api.cloudone.access_reports().then(function(ret) {
                sessionStorage.access_reports = ret.access_reports_link;
                window.open(ret.access_reports_link, '_blank');
                core.elements['global-loader'].hide();
            })
        }
    }
};

function remove_element(camid, reportType) {
    $("#"+reportType+"ChosenCam" + camid).remove();
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
