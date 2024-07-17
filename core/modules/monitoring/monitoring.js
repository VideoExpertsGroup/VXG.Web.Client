window.screens = window.screens || {};
var path = window.core.getPath('monitoring.js');
//const locTypes = ["Province", "City", "Zone", "Circuit", "Subcircuit"];

window.screens['monitoring'] = {
  'menu_weight': 31,
  'menu_name': $.t('monitoring.title'),
  'get_args': function () {
    var hash = window.location.hash;
    var queryStr = hash.substring(hash.indexOf("?") + 1);
    var camerasIdsStr = queryStr.includes('camera_id') ? queryStr.split('=')[1] : '';
    return camerasIdsStr.split(',');
  },
//  TODO:
//    'menu_toggle':true,
//    'menu_disabled':true,
  'menu_icon': '<i class="fa fa-th-large" aria-hidden="true"></i>',
  'html': path + 'monitoring.html',
  'css': [path + 'monitoring.css'],
  'js': ["core/webcontrols/camera_map.js"],
  'stablecss': [path + 'monitoring.css'],
  'playerList': null,
  pageMode: 'live',
  playMode: 'live',
  playerController: null,
  'on_search': function (text) {
    if (!text)
      delete this.search_text;
    else
      this.search_text = text;
    window.screens['monitoring'].activate();
  },
  'on_show': function (filterarray) {
    setTimeout(function () {
      onCameraScreenResize();
    }, 100);

    core.elements['header-search'].hide();
    //if (core.elements['header-search']) core.elements['header-search'].find('input').val(this.search_text ? this.search_text : '');
    if (!filterarray) {
      var userFilters = localStorage.getItem("filter-" + vxg.user.src.email)
      if (!userFilters) {
        filterarray = []
      } else {
        filterarray = JSON.parse(userFilters);
      }
    }

    let self = this;
    let p = this.wrapper.find('player');
    for (i = 0; i < p.length; i++) {
      var t = $(p[i]).attr('access_token')
      if ($(p[i]).attr('access_token')) {
        p[i].play();
      }
    }
    var hash = window.location.hash;
    var queryStr = hash.replaceAll("%22", "").substring(hash.indexOf("=") + 1);
    if (queryStr.length > 0) {
      $('.hidecameras').attr('disabled', true);
    } else {
      $('.hidecameras').attr('disabled', false);
    }

    $('.hidecameras').removeClass('closed');
    $('.hidecameras').addClass('open');
    $('.hidecameras').html(`<i class="fa fa-angle-left" aria-hidden="true"></i>`);
    $('.camlist-cont').show();
    $('.headerBlock').show();

    setTimeout(() => {
      if (self.playerList && self.playerList.getPlayerList()) {
        self.playerList.synchronize();
      }
    }, 1500);

    self.camGrid(self.getState().grid);

    $(".camlist-monitoring").empty();
    $(".camlist-monitoring").append($('<div class="loader section-loader monitoring-loader"></div>'))
    if (window.showNotes) {
      return vxg.api.cloud.getAllNotes(vxg.user.src.allCamsToken).then(ret => {
        var notesList = ret.objects;
        if (notesList.length > 0) {
          $('.nonotes').hide();
          var notesEle = '';
          notesList.forEach(note => {
            let timestamp = new Date(note['timestamp'] + 'Z').getTime();
            date = new Date(note['timestamp'] + 'Z');
            date = date.toLocaleString('en-CA', {
              year: 'numeric',
              month: 'numeric',
              day: 'numeric',
              hour: 'numeric',
              minute: 'numeric',
              second: 'numeric',
              hour12: true
            }).replace(/[,|.]/g, '').replace(' 24', ' 00');
            notesEle += '<div class="onetag font-md" timestamp="' + timestamp + '">';
            if (vxg.user.src.role != 'user') notesEle += '<div class="edtag" meta="' + i + '"></div>';
            notesEle += '<div class="datetime">' + date + '</div><div class="case font-md">' + (note['string']['case'] ? note['string']['case'] : '') + '</div><div class="desc">' + (note['string']['description'] ? note['string']['description'] : '') + '</div></div>';
          })
          $('.monitoring-noteslist').html(notesEle);
          $('.monitoring-noteslist').show();
        }
        if (localStorage.locationHierarchyCams == undefined)
          return self.createLocationHierarchy();
        else {
          return self.onLocationHierarchyLoaded(JSON.parse(localStorage.locationHierarchyCams));
        }
      }, function (err) {
        console.log(err.responseText);
        if (localStorage.locationHierarchyCams == undefined) {
          return self.createLocationHierarchy();
        } else {
          return self.onLocationHierarchyLoaded(JSON.parse(localStorage.locationHierarchyCams));
        }
      });
    } else {
      if (localStorage.locationHierarchyCams == undefined) {
        return self.createLocationHierarchy();
      } else {
        return self.onLocationHierarchyLoaded(JSON.parse(localStorage.locationHierarchyCams));
      }
      if (localStorage.locationHierarchyCams == undefined) {
        return self.createLocationHierarchy();
      } else {
        return self.onLocationHierarchyLoaded(JSON.parse(localStorage.locationHierarchyCams));
      }
    }
  },
  playChannels: function (resolve) {
    if (this.camera_list_promise) return this.camera_list_promise;
    return this.camera_list_promise;
  },
  selectCamForGroup: function (e) {
    var groupCamsList = $("#groupingCams").val();
    var channelId = $(this).attr("channelid");
    if (!groupCamsList || groupCamsList.indexOf(channelId) == -1) {
      groupCamsList += "," + channelId;
      $("#groupingCams").val(groupCamsList);
      $("#groupingButton").show();
    } else {
      // if channelId is in groupCamsList remove it,
      groupCamsList.replace("," + channelId, "");
      $("#groupingCams").val(groupCamsList);
      if (!groupCamsList) $("#groupingButton").hide();
    }
  },
  'on_hide': function () {
    core.elements['global-loader'].show();
    let p = this.wrapper.find('player');
    for (i = 0; i < p.length; i++) p[i].remove();
    this.destroyPlayerController();
    core.elements['global-loader'].hide();
  },
  'on_before_show': function () {
    var hash = window.location.hash;
    var telconetIdStr = hash.includes("?camera_id=") ? hash.replaceAll("%22", "").substring(hash.indexOf("=") + 1) : "";
    var isTelconet = telconetIdStr.length > 0;

    let self = this;
    self.camGrid(this.getState().grid, isTelconet);
    return defaultPromise();
  },
  'on_ready': function () {
    let self = this;

    this.wrapper.find('.camlist-monitoring')[0].addEventListener('scroll', function () {
      if (this.scrollHeight - this.scrollTop <= this.clientHeight + 20)
        self.wrapper.find('.camlist-monitoring').addClass('nobloor');
      else
        self.wrapper.find('.camlist-monitoring').removeClass('nobloor');
    });
    var hash = window.location.hash;
    var telconetIdStr = hash.includes("?camera_id=") ? hash.replaceAll("%22", "").substring(hash.indexOf("=") + 1) : "";
    // var isTelconet = telconetIdStr.length > 0 ? true : false;

    // self.camGrid(this.getState().grid, isTelconet);
    self.wrapper.addClass('grid');
    setTimeout(function () {
      onCameraScreenResize();
    }, 100);
    self.wrapper.find('.cambd').show();
    self.wrapper.find('.cammap').hide();

    if (telconetIdStr.length > 0) {
      var telconetIdArr = telconetIdStr.split(",");

      var gridType = 3;
      if (telconetIdArr.length <= 4) gridType = 2;
      if (telconetIdArr.length > 9) gridType = 4
      let state = self.getState();
      state.grid = gridType;
      self.setState(state);
      var playerNumber = 1;
      return vxg.cameras.getCameraListPromise(telconetIdArr.length, 0, telconetIdStr, undefined, undefined).then((cameras) => {
        if (camera.length == 0) return;

        cameras.forEach(cam => {
          var pl = $('[playernumber=' + playerNumber + ']').find('.player');
          if (!pl.length) return;
          pl.attr('access_token', cam.token);
          pl.attr('src', cam.token);
          pl.attr('name', cam.src?.name);
          pl.attr('recording', cam.src?.recording);
          if (typeof pl[0].on_access_token_change === "function") pl[0].on_access_token_change({
            token: cam.token,
            name: cam.src?.name,
            recording: cam?.src.recording
          }, true);
          pl[0].play();
          playerNumber++;
        })
        $('.hidecameras').trigger("click");
        $('.hidecameras').attr('disabled', true);
        $('.close-menu').trigger("click");

        return true;
      })
    }
  },
  setState: function (state) {
    let newstate = localStorage['vxggrid'] ? JSON.parse(localStorage['vxggrid']) : {};
    if (newstate.cams !== undefined) newstate = {};
    newstate[vxg.user.src.uid] = state;
    localStorage['vxggrid'] = JSON.stringify(newstate);
  },
  getState: function () {
    let state = localStorage['vxggrid'] ? JSON.parse(localStorage['vxggrid']) : [];
    if (state.cams !== undefined) state = [];
    state = state[vxg.user.src.uid];
    if (!state || state.cams === undefined || state.grid === undefined) return {cams: {}, grid: 2};
    return state;
  },
  'on_init': function () {
    let self = this;

    $('.hidenotes').on('click', function (e) {
      e.preventDefault();
      e.stopPropagation();
      if ($(this).hasClass('open')) {
        $(this).removeClass('open');
        $(this).addClass('closed');
        $(this).html('<i class="fa fa-angle-left" aria-hidden="true"></i>');
        $('.notes-list-cont').hide();
        //$('.noteslist').hide();
      } else {
        $(this).removeClass('closed');
        $(this).addClass('open');
        $(this).html(`<i class="fa fa-angle-right" aria-hidden="true"></i>`);
        $('.notes-list-cont').show();
        //$('.noteslist').show();
      }
    });

    $('.hidecameras').on('click', function (e) {
      e.preventDefault();
      e.stopPropagation();
      if ($(this).hasClass('open')) {
        $(this).removeClass('open');
        $(this).addClass('closed');
        $(this).html('<i class="fa fa-angle-right" aria-hidden="true"></i>');
        $('.camlist-cont').hide();
        $('.headerBlock').hide();

      } else {
        $(this).removeClass('closed');
        $(this).addClass('open');
        $(this).html(`<i class="fa fa-angle-left" aria-hidden="true"></i>`);
        $('.camlist-cont').show();
        $('.headerBlock').show();
      }
    })

    $('#camlist-title').on('click', function () {
      // reset the monitoring list by calling it again
      localStorage.removeItem("locationHierarchyCams");
      localStorage.removeItem("noLocCams");
      $(".camlist-monitoring").empty();
      $(".camlist-monitoring").append($('<div class="loader section-loader monitoring-loader"></div>'))
      return self.createLocationHierarchy();
    });

    let gridStateArray = [];
    gridStateArray[2] = '2 x 2';
    gridStateArray[3] = '3 x 3';
    gridStateArray[4] = '4 x 4';
    gridStateArray[5] = 'Custom';

    let curState = self.getState();
    core.elements['header-right'].prepend(`
        <div class="monitoring-toolbar d-flex align-items-center">
            <button class="transparent-button active btn-monitoring-mode">${$.t('monitoring.live')} / ${$.t('monitoring.recorded')}</button>
            <div class="transparent-button active addnote">
                <span class="add-icon">+</span><span data-i18n="monitoring.createNote">${$.t('monitoring.createNote')}</span>
            </div>
            <div tabindex="0" class="gridmenu hide transparent-button">
                <span>${gridStateArray[curState.grid]}</span><i class="fa fa-angle-down" aria-hidden="true"></i>
                <ul class="menu-dropdown gridmenu-dropdown">
                    <li class="cam-dropdown-item grid22"><a href="javascript:;">2 x 2</a></li>
                    <li class="cam-dropdown-item grid33"><a href="javascript:;">3 x 3</a></li>
                    <li class="cam-dropdown-item grid44"><a href="javascript:;">4 x 4</a></li>
                    <li class="cam-dropdown-item gridcustom"><a href="javascript:;">Custom</a></li>
                </ul>
            </div>
        </div>
    `);

    const monitoringModeBtn = document.querySelector('.btn-monitoring-mode');
    monitoringModeBtn.onclick = () => {
      self.pageMode = self.pageMode === 'live' ? 'live/recorded' : 'live';
      if (self.pageMode === 'live') {
        self.playMode = 'live';
        monitoringModeBtn.textContent = `${$.t('monitoring.live')} / ${$.t('monitoring.recorded')}`;
      } else {
        monitoringModeBtn.textContent = $.t('monitoring.live');
      }
      self.camGrid(self.getState().grid);
    };

    var notesMode = sessionStorage.notesMode;
    if (notesMode) {
      if (notesMode == "disabled") $(".addnote").addClass("disabled");
    } else {
      try {
        var inc = new Date().getTime() / 1000;
        self.camera.createClip(inc - 10000, inc + 10000, "testingClip").then(function (clip) {
          clip.setMeta("testingMeta", "", "", inc).then(function (readyclip) {
            console.log("meta is working, delete clip and camera just made");
            sessionStorage.setItem("notesMode", "enabled");
          }, function () {
            sessionStorage.setItem("notesMode", "disabled");
            $(".addnote").addClass("disabled");
          });
          vxg.api.cloud.deleteClipV2(clip.token, clip.src.id).then(function (r) { /* testing clip deleted */
          }, function (err) {
            console.log(err)
          })
        }, function () {
          console.log("Test clip isn't working, something bad has happened");
        });
      } catch (err) {
        console.log(err);
      }
    }

    $('.grid-player').removeAttr('playerNumber');
    var playerCount = 1;
    $('.grid-player').each(function (i, el) {
      if ($(el).children().length > 0) {
        $(el).attr('playerNumber', playerCount);
        playerCount++;
      }
    })

    core.elements['header-right'].find('.grid22').click(function () {
      $('.grid-player').removeAttr('playerNumber');
      var playerCount = 1;
      $('.grid2').each(function (i, el) {
        $(el).attr('playerNumber', playerCount);
        playerCount++;
      })

      if ($('.hidecameras').hasClass('open')) $('#cameras-list').show();
      let state = self.getState();
      state.grid = 2;
      self.setState(state);
      if (state.list && self.playerList) {
        state.list = false;
        self.setState(state)
        //location.reload();
      } else {
        self.wrapper.find('.ratio2-inner').show();
        self.wrapper.find('.cambd').show();
        self.wrapper.find('.cammap').hide();
        self.wrapper.find('.grid-stack-container').hide();
        self.camGrid(2);
        core.elements['header-right'].find('.gridmenu span').text($(this).text());
      }
    });
    core.elements['header-right'].find('.grid33').click(function () {
      $('.grid-player').removeAttr('playerNumber');
      var playerCount = 1;
      $('.grid-player').each(function (i, el) {
        if ($(el).hasClass('grid2') || $(el).hasClass('grid3')) {
          $(el).attr('playerNumber', playerCount);
          playerCount++;
        }
      })

      if ($('.hidecameras').hasClass('open')) $('#cameras-list').show();
      let state = self.getState();
      state.grid = 3;
      self.setState(state);
      if (state.list && self.playerList) {
        state.list = false;
        self.setState(state)
        //location.reload();
      } else {
        self.wrapper.find('.ratio2-inner').show();
        self.wrapper.find('.cambd').show();
        self.wrapper.find('.cammap').hide();
        self.wrapper.find('.grid-stack-container').hide();
        self.camGrid(3);
        core.elements['header-right'].find('.gridmenu span').text($(this).text());
      }
    });
    core.elements['header-right'].find('.grid44').click(function () {
      if (self.getState().grid == 1) location.reload();

      $('.grid-player').removeAttr('playerNumber');
      var playerCount = 1;
      $('.grid-player').each(function (i, el) {
        $(el).attr('playerNumber', playerCount);
        playerCount++;
      })

      if ($('.hidecameras').hasClass('open')) $('#cameras-list').show();
      let state = self.getState();
      state.grid = 4;
      self.setState(state);
      if (state.list && self.playerList) {
        state.list = false;
        self.setState(state)
        // location.reload();
      } else {
        self.wrapper.find('.ratio2-inner').show();
        self.wrapper.find('.cambd').show();
        self.wrapper.find('.cammap').hide();
        self.wrapper.find('.grid-stack-container').hide();
        self.camGrid(4);
        core.elements['header-right'].find('.gridmenu span').text($(this).text());
      }
    });
    core.elements['header-right'].find('.gridcustom').click(function () {
      let state = self.getState();
      state.grid = 5;
      self.setState(state);
      self.wrapper.find('.ratio2-inner').hide();
      self.wrapper.find('.cammap').hide();
      core.elements['header-right'].find('.gridmenu span').text($(this).text());

      self.camGrid(5);
    });

    $('.monitoring .btn-add-grid-cell').on('click', function () {
      self.addCustomGridCell();
    });

    $(".addnote").click(function () {
      dialogs['mdialog'].activate(`
            <h7 data-i18n="monitoring.createNote">${$.t('monitoring.createNote')}</h7>
            <span class="error-text" style="display:none"></span>
            <div class="note-input-cont">
                <table border=0>
                    <tr><td class="time-label" data-i18n="monitoring.inctime">${$.t('monitoring.inctime')}:</td><td class="inctime"><input type="datetime-local" name="inctime"></input></td></tr>
                    <tr><td class="title-label" data-i18n="monitoring.case">${$.t('monitoring.case')}:</td><td></td></tr>
                    <tr><td colspan=2 class="case"><input class="tagcase" type="text" name="case"/></td></tr>
                </table>
                <textarea class="tagdesc" name="desc" rows="5"></textarea>
            </div>
            <button name="apply" class="vxgbutton-transparent savetag" data-i18n="monitoring.savebtn">${$.t('monitoring.savebtn')}</button></div>  
        `).then(function (r) {
        if (!r || r.button != 'apply') return;
        if (!r.form.inctime || !r.form.case || !r.form.desc) {
          $(".error-text").text($.t('monitoring.errorText.missingfield'));
        } else {
          core.elements['global-loader'].show();
          let date = new Date(r.form.inctime).toISOString().replace('Z', '');
          let req = {
            "timestamp": date,
            "long": {"usermeta": 1},
            "string": {"type": "note", "case": r.form.case, "description": r.form.desc}
          };

          var firstGridCamToken = null;
          var gridcameras = $('[playernumber]');
          for (var i = 0; i < gridcameras.length; i++) {
            var player = $(gridcameras[i]).find('.player');
            var token = player.attr('access_token') || player.attr('src');
            if (token) {
              firstGridCamToken = token;
              break;
            }
          }

          if (!firstGridCamToken) {
            core.elements['global-loader'].hide();
            alert($.t('monitoring.errorText.nogridcams'));
            return;
          }

          core.elements['global-loader'].show();

          vxg.api.cloud.saveUserMeta(firstGridCamToken, [req]).then(function () {
            core.elements['global-loader'].hide();
            location.reload();
            return;
          }, function (err) {
            core.elements['global-loader'].hide();
            console.log(err.responseText);
            alert($.t('monitoring.errorText.saveerror'));
          });
        }
      });
    });

    $(window).resize(onCameraScreenResize);

    return defaultPromise();
  },
  camGrid: function (size, /* 2,3,4, 5 - custom */ telconet = false) {
    var self = this;

    let isLiveMode = self.playMode === 'live';
    if (self.pageMode === 'live') {
      $('#multiplayer-control').html('');
      isLiveMode = true;
    } else {
      $('#multiplayer-control').html(`<k-multiplayer-controller id="multiplayer-controller" playtime="${Date.now()}" multi-databars mode="${isLiveMode ? 'live' : 'recorded'}"></k-multiplayer-controller>`);
    }

    if (size === 5) {
      $('.ratio2-inner').hide();
      $('.grid-stack-container').show();
      if (!self.grid) {
        self.createCustomGrid();
      }
      self.setCamerasOnCustomGrid(isLiveMode);
    } else {
      $('.grid-stack-container').hide();
      $('.ratio2-inner').show();
      self.setGridCameras(size, telconet, isLiveMode);
    }

    self.initPlayerController();

    self.setPlayerEventListeners();

    onCameraScreenResize();
  },
  initPlayerController() {
    var self = this;
    self.playerController = document.querySelector('#multiplayer-controller');
    if (self.playerController && typeof self.playerController.init === 'function') {
      self.playerController.init();
      self.playerController.addEventListener('modeChange', (e) => {
        if (e.mode !== self.playMode) {
          self.playMode = e.mode;
          self.camGrid(self.getState().grid);
        }
      });
    }
  },
  destroyPlayerController() {
    var self = this;
    if (self.playerController) {
      self.playerController.remove();
      self.playerController = undefined;
    }
  },
  setPlayerEventListeners() {
    const self = this;
    $('.screens .monitoring .player').off('dblclick').on('dblclick', function (e) {
      if (!$(this).attr('access_token') && !$(this).attr('src')) return;

      e.preventDefault();
      e.stopPropagation();

      let the = this;
      dialogs['mdialog'].activate(`<p>${$.t('monitoring.confirmDelete')}</p><p><button name="cancel" class="vxgbutton">${$.t('action.no')}</button>&nbsp;&nbsp;&nbsp;&nbsp;<button name="delete" class="vxgbutton">${$.t('action.yes')}</button></p>`).then(function (r) {
        if (r.button != 'delete') return;
        $(the).attr('access_token', '').attr('src', '').attr('name', '').attr('recording', '');
        $(the)[0].on_access_token_change(null);
        let id = $(the).attr('id');
        const state = self.getState();
        state.cams = state.cams || {};
        delete state.cams[id];
        self.setState(state);
      });
    });

    $('.screens .monitoring .player').each(function () {
      this.on_access_token_change = function (camera, telconet = false) {
        if (camera === undefined) {
          return;
        }

        if (typeof camera === 'string') {
          camera = {
            name: $(this).attr('name'),
            token: camera,
            recording: $(this).attr('recording') === 'true',
          };
        }
        let id = $(this).attr('id');
        let state = self.getState();
        if (telconet) {
          let cloudPlayerId = this.newid;
          var cloudPlayerObj = window.controls['player'].players['player' + cloudPlayerId];
          return;
        }

        state.cams = state.cams || {};
        state.cams[id] = camera;
        self.setState(state);

        if (self.playerList) {
          let cloudPlayerId = this.newid;
          var cloudPlayerObj = window.controls['player'].players['player' + cloudPlayerId];
          if (access_token == '') {
            self.playerList.removePlayerFromList(cloudPlayerObj)
          }
          self.playerList.killSyncPromise(true).then(() => {
            setTimeout(() => {
              self.playerList.killSyncPromise(false).then(() => {
                self.playerList.synchronize([], true)
              })
            }, 1500);
          })
        }
      };
    });
  },
  setGridCameras: function (size, telconet, isLiveMode) {
    const self = this;

    let el = $('.screens .monitoring .camgrid2')
    el.removeClass('grid3').removeClass('grid4');
    if (size === 3) el.addClass('grid3');
    if (size === 4) el.addClass('grid4');
    let td = $('.screens .monitoring .camgrid2 > div');
    let state = self.getState();
    if (!self.playerList) {
      try {
        //window.screens['cameras'].playerList = new CloudPlayerList("single-timeline", {timeline: true, calendar: true});
      } catch (e) {
        self.playerList = null;
      }
    }
    const preferredPlayerFormat = (window.skin.grid && window.skin.grid.preferredPlayerFormat) ? (' preferredPlayerFormat="' + window.skin.grid.preferredPlayerFormat + '" ') : ('');

    for (let i = 0; i < td.length; i++) {
      let camera = !telconet ? state.cams['player' + i] : null;
      let cameraName = '';
      let accessToken = '';
      let recording = false;
      if (camera && typeof camera === 'object') {
        accessToken = camera.token;
        cameraName = camera.name;
        recording = camera.recording || false;
      }
      // access_token = 'eyJjYW1pZCI6IDYxLCAiY21uZ3JpZCI6IDYxLCAiYWNjZXNzIjogImFsbCIsICJ0b2tlbiI6ICJzaGFyZS5leUp6YVNJNklERXlNMzAuNjViNDI4Mzl0YmMxZmFiMDAua3NqcUp5dVhMQmhXOE5oWDZOQzNXRWlzeElVIiwgImFwaSI6ICJ3ZWIudnhnLWRldi52eGctZGV2LmNsb3VkLXZtcy5jb20iLCAiY2FtIjogImNhbS52eGctZGV2LnZ4Zy1kZXYuY2xvdWQtdm1zLmNvbSJ9';
      const playerHtml = isLiveMode
        ? `<player class="player grid-multiplayer" id="player${i}" name="${cameraName}" access_token="${accessToken}" recording="${recording}" ac loader_timeout=-1 ${preferredPlayerFormat}>player</player>`
        : `<vxg-cloud-player class="player" id="player${i}" playtime="${Date.now()}" autoprop muted thumbnails controls="k-control-timepicker" videomodule="k-video-vxg" multiplayer-controller-id="multiplayer-controller" name="${cameraName}" src="${accessToken}" recording="${recording}" options="{&quot;left_prefetch&quot;:1,&quot;right_prefetch&quot;:2,&quot;video_limit&quot;:1000,&quot;max_buffer_size&quot;:1000,&quot;sync_duration&quot;:15}"></vxg-cloud-player>`;
      if ($(td[i]).hasClass('grid3')) {
        if (size >= 3) {
          $(td[i]).html(playerHtml);
        } else {
          $(td[i]).empty();
        }
      } else if ($(td[i]).hasClass('grid4')) {
        if (size >= 4) {
          $(td[i]).html(playerHtml);
        } else {
          $(td[i]).empty();
        }
      } else {
        if (size < 2) {
          $(td[i]).empty();
        } else {
          $(td[i]).html(playerHtml);
        }
      }
    }
  },
  createCustomGrid: function () {
    $('.ratio2-inner').hide();
    $('.cammap').hide();

    const self = this;
    let state = self.getState();
    const items = state?.gridItems ?? [
      { id: 1, x: 0, y: 0, w: 4, h: 4, content: '' },
      { id: 2, x: 4, y: 0, w: 4, h: 4, content: '' },
      { id: 3, x: 4, y: 4, w: 4, h: 2, content: '' },
      { id: 4, x: 0, y: 4, w: 2, h: 2, content: '' },
      { id: 5, x: 8, y: 0, w: 2, h: 2, content: '' },
      { id: 6, x: 8, y: 2, w: 2, h: 2, content: '' },
      { id: 7, x: 2, y: 4, w: 2, h: 2, content: '' },
      { id: 8, x: 10, y: 0, w: 1, h: 1, content: '' },
      { id: 9, x: 10, y: 1, w: 1, h: 1, content: '' },
    ];
    self.grid = GridStack.init();
    self.grid.load(items);

    self.grid.on('added change removed', () => {
      state = self.saveCustomGrid(self.grid.engine.nodes);
    });

    $('.grid-stack-container').show();

    if (!state?.gridItems) {
      self.saveCustomGrid(self.grid.engine.nodes);
    }

    self.setPlayerEventListeners();
    self.setCustomGridEventListeners();
  },
  setCustomGridEventListeners: function () {
    const self = this;
    $('.grid-stack-container .grid-stack-item').off('dblclick').on('dblclick', function () {
      const the = this;
      dialogs['mdialog'].activate(`<p>${$.t('monitoring.deleteCustomGridConfirm')}</p><p><button name="cancel" class="vxgbutton">${$.t('action.no')}</button>&nbsp;&nbsp;&nbsp;&nbsp;<button name="delete" class="vxgbutton">${$.t('action.yes')}</button></p>`).then(function (r) {
        if (r.button != 'delete') return;
        self.grid.removeWidget(the);
      });
    });

    $('.grid-stack-item').off('drop dragdrop').on('drop dragdrop', function (event) {
      var id = event.originalEvent.dataTransfer.getData('text');
      if (!id) return;
      let pl = $(document.elementFromPoint(event.clientX, event.clientY));
      if (!pl.hasClass('player')) {
        pl = pl.parents('.player');
      }
      if (!pl.length) return;
      var gridId = $(pl).parent().parent().attr("gs-id");

      var cameras;
      if (id.startsWith('loc-')) {
        cameras = $(`#${id} > .camslist > .parent-cam`);
      } else {
        cameras = $(`#${id}`);
      }
      cameras.each(function (i, cam_el) {
        var pl = $(`[gs-id=${gridId}]`).find('.player');
        if (!pl.length) return;
        var cam = $(cam_el);
        var channelToken = cam.attr("channel_token");
        var cameraName = cam.attr("camera_name");
        var recording = cam.attr("recording");
        pl.attr('access_token', channelToken);
        pl.attr('src', channelToken);
        pl.attr('name', cameraName);
        pl.attr('recording', recording);
        if (typeof pl[0].on_access_token_change === "function") pl[0].on_access_token_change({
          name: cameraName,
          token: channelToken,
          recording
        });
        setTimeout(function () {
          pl[0].play();
        }, 200)
        gridId++;
      });
    });
  },
  saveCustomGrid: function (nodes) {
    const state = this.getState();
    state.gridItems = nodes.map((node) => ({
      x: node.x,
      y: node.y,
      w: node.w,
      h: node.h,
      content: node.content,
      id: node.id,
    }));
    this.setState(state);
    return state;
  },
  addCustomGridCell: function () {
    if (!this.grid) {
      return;
    }

    const self = this;
    const state = self.getState();
    const id = Math.max(0, ...state.gridItems.map((item) => item.id)) + 1;
    self.grid.addWidget({
      id,
      content: '',
    });

    setTimeout(() => {
      const isLiveMode = self.pageMode === 'live' || self.playMode === 'live';
      const preferredPlayerFormat = (window.skin.grid && window.skin.grid.preferredPlayerFormat) ? (' preferredPlayerFormat="' + window.skin.grid.preferredPlayerFormat + '" ') : ('');
      const playerHtml = isLiveMode
        ? `<player class="player grid-multiplayer" id="grid-player${id}" name="" access_token="" recording="false" ac loader_timeout=-1 ${preferredPlayerFormat}>player</player>`
        : `<vxg-cloud-player class="player" id="grid-player${id}" playtime="${Date.now()}" autoprop muted thumbnails controls="k-control-timepicker" videomodule="k-video-vxg" multiplayer-controller-id="multiplayer-controller" name="" src="" recording="false" options="{&quot;left_prefetch&quot;:1,&quot;right_prefetch&quot;:2,&quot;video_limit&quot;:1000,&quot;max_buffer_size&quot;:1000,&quot;sync_duration&quot;:15}"></vxg-cloud-player>`;
      $(`[gs-id="${id}"] .grid-stack-item-content`).html(playerHtml);

      self.setPlayerEventListeners();
      self.setCustomGridEventListeners();
    }, 0);
  },
  setCamerasOnCustomGrid: function (isLiveMode) {
    const self = this;
    const state = self.getState();
    if (!state.gridItems) {
      return;
    }

    const preferredPlayerFormat = (window.skin.grid && window.skin.grid.preferredPlayerFormat) ? (' preferredPlayerFormat="' + window.skin.grid.preferredPlayerFormat + '" ') : ('');

    state.gridItems.forEach((item) => {
      let camera = state.cams[`grid-player${item.id}`];
      let cameraName = '';
      let accessToken = '';
      let recording = false;
      if (camera && typeof camera === 'object') {
        accessToken = camera.token;
        cameraName = camera.name;
        recording = camera.recording || false;
      }
      const playerHtml = isLiveMode
        ? `<player class="player grid-multiplayer" id="grid-player${item.id}" name="${cameraName}" access_token="${accessToken}" recording="${recording}" ac loader_timeout=-1 ${preferredPlayerFormat}>player</player>`
        : `<vxg-cloud-player class="player" id="grid-player${item.id}" playtime="${Date.now()}" autoprop muted thumbnails controls="k-control-timepicker" videomodule="k-video-vxg" multiplayer-controller-id="multiplayer-controller" name="${cameraName}" src="${accessToken}" recording="${recording}" options="{&quot;left_prefetch&quot;:1,&quot;right_prefetch&quot;:2,&quot;video_limit&quot;:1000,&quot;max_buffer_size&quot;:1000,&quot;sync_duration&quot;:15}"></vxg-cloud-player>`;
      $(`[gs-id="${item.id}"] .grid-stack-item-content`).html(playerHtml);
    });
  },
  onLocationHierarchyLoaded: function (locationHierarchy) {
    var dropdownTree;
    locationHierarchy = this.sortLocations(locationHierarchy);
    var locsSet = Object.keys(locationHierarchy).length > 0;
    if (locsSet) dropdownTree = this.createLocationList(locationHierarchy)

    $(".camlist-monitoring").empty();
    $('[name="location_strs"]').empty();

    $(".camlist-monitoring").append(dropdownTree);

    var noLocationCams = localStorage.noLocCams;
    if (!noLocationCams) {
      window.vxg.cameras.getCameraListPromise(500, 0, undefined, "location,isstorage", undefined).then((noLocsCams) => {
        var noLocsDiv;
        var noLocsCams_noStorage = noLocsCams.filter(cam => {
          return cam.src.meta?.isstorage == undefined
        });
        if (!locsSet && noLocsCams_noStorage.length == 0) {
          noLocsDiv = $('<div class="noCams"> <p class="noCamsMessage"> No cameras have been added to this account. </p> </div>')
        } else {
          noLocsDiv = this.noLocationList(noLocsCams_noStorage);
        }
        if (noLocsCams_noStorage.length > 0) localStorage.noLocCams = JSON.stringify(noLocsCams_noStorage);
        $(".camlist-monitoring").append(noLocsDiv);
      })
    } else {
      var noLocsDiv;
      var noLocsCams = JSON.parse(noLocationCams);
      if (!locsSet && noLocsCams.length == 0) {
        noLocsDiv = $('<div class="noCams"> <p class="noCamsMessage"> No cameras have been added to this account. </p> </div>')
      } else {
        noLocsDiv = this.noLocationList(noLocsCams);
      }
      $(".camlist-monitoring").append(noLocsDiv);
    }

    $('.loc-draggable, .parent-cam').on("dragstart", function (e) {
      e.stopPropagation();
      e.originalEvent.dataTransfer.setData('text', e.currentTarget.id)
    });

    $('.loc-draggable, .parent-cam, .camgrid2').on('drop dragdrop', function (event) {
      var id = event.originalEvent.dataTransfer.getData('text');
      if (!id) return;
      let pl = $(document.elementFromPoint(event.clientX, event.clientY));
      if (!pl.hasClass('player')) {
        pl = pl.parents('.player');
      }
      if (!pl.length) return;
      var gridNum = $(pl).parent().attr("playernumber");

      var cameras;
      if (id.startsWith('loc-')) {
        cameras = $(`#${id} > .camslist > .parent-cam`);
      } else {
        cameras = $(`#${id}`);
      }
      cameras.each(function (i, cam_el) {
        var pl = $('[playernumber=' + gridNum + ']').find('.player');
        if (!pl.length) return;
        var cam = $(cam_el);
        var channelToken = cam.attr("channel_token");
        var cameraName = cam.attr("camera_name");
        var recording = cam.attr("recording");
        pl.attr('access_token', channelToken);
        pl.attr('src', channelToken);
        pl.attr('name', cameraName);
        pl.attr('recording', recording);
        if (typeof pl[0].on_access_token_change === "function") pl[0].on_access_token_change({
          name: cameraName,
          token: channelToken,
          recording
        });
        setTimeout(function () {
          pl[0].play();
        }, 200)
        gridNum++;
      });
    });

    $('.loc-draggable, .parent-cam, .camgrid2, .grid-stack-item').on('dragover', function (event) {
      event.preventDefault();
      return false;
    })
    $('.loc-draggable, .parent-cam, .camgrid2, .grid-stack-item').on('dragenter', function (event) {
      event.preventDefault();
    })
    $('.loc-draggable, .parent-cam, .camgrid2, .grid-stack-item').on('dragleave', function (event) {
      event.preventDefault();
    });

    this.setCustomGridEventListeners();
  },
  sortLocations: function (locationHierarchy) {
    if (typeof locationHierarchy != "object" || locationHierarchy instanceof Array) // Not to sort the array
      return locationHierarchy;
    var locs = Object.keys(locationHierarchy);
    locs.sort();
    var locLevel = {};
    for (var i = 0; i < locs.length; i++) {
      locLevel[locs[i]] = this.sortLocations(locationHierarchy[locs[i]])
    }
    return locLevel;
  },
  createLocationList: function (locationHierarchy) {
    if (locationHierarchy instanceof Object && !(locationHierarchy instanceof String)) {
      var firstObj = Object.keys(locationHierarchy)[0] && Object.keys(locationHierarchy)[0].includes("province") && !Object.keys(locationHierarchy)[1] ? Object.keys(locationHierarchy)[0] : Object.keys(locationHierarchy)[1];
      var locType = firstObj ? firstObj.split("_")[0] : "EMPTYLOC";
      var ul = $(`<ul class="location-hierarchy ${locType}-ul" ${(locType !== "province" ? `style="display:none"` : `id="monitor-locations"`)}></ul>`);
      var li_ele;
      for (var child in locationHierarchy) {
        var childName = child.substring(child.indexOf("_") + 1).replaceAll("_", " ");
        if (!isNaN(childName)) break;
        if (childName === "cams") {
          ul.addClass("camslist");
          var li_str = "";
          locationHierarchy.cams.forEach(cam => {
            let captured = cam.src && cam.src.meta && cam.src.meta.capture_id && vxg.user.src.capture_id == cam.src.meta.capture_id ? ' captured' : '';
            li_str += `
              <div class="camerafield-block${captured} parent-cam" id="${child}-${cam.camera_id}" access_token="${cam.camera_id}" channel_token="${cam.token}" camera_name="${cam.src?.name}" recording="${cam.src?.recording || false}" draggable="true">
                  <camfield field="name" onclick_toscreen="tagsview" access_token="${cam.camera_id}"></camfield>
              </div>`;
          });
          li_ele = $(li_str);
        } else {
          li_ele = $(`
            <li class="loc-dropdown ${child}-dropdown loc-draggable" id="loc-${child}" draggable="true" locName=${child}>
                <div class="location-btn-cont =">
                    <div class="loc-label-name">
                        <i class="fa fa-home" aria-hidden="true"></i>
                        <span class="loc-name">${childName}</span>
                    </div>
                    <i class="location-arrow fa fa-caret-down" onclick="showNextTier(event, this, '${locType}')" aria-hidden="true"></i>
                </div>    
            </li>`);
        }

        li_ele.append(this.createLocationList(locationHierarchy[child], false));
        ul.append(li_ele);
      }
      return ul;
    }
  },
  noLocationList: function (noLocCams) {
    var noLocsDiv = $(`<div class="noLocs"></div>`);
    for (var i = 0; i < noLocCams.length; i++) {
      var camDiv = $(`
          <div class="camerafield-block captured parent-cam" id="noloc-${noLocCams[i].camera_id}" access_token="${noLocCams[i].camera_id}" channel_token="${noLocCams[i].token}" camera_name="${noLocCams[i].src?.name}" recording="${noLocCams[i].src?.recording || false}" draggable="true">
              <camfield field="name" onclick_toscreen="tagsview" access_token="${noLocCams[i].camera_id}">
                <i class="fa fa-video-camera mon-camera" aria-hidden="true"></i>
                <span>${noLocCams[i].src?.name}</span>
              </camfield>
          </div>
      `);
      noLocsDiv.append(camDiv);
    }
    return noLocsDiv;
  },
  createLocationHierarchy: function () {
    var self = this;
    var locationHierarchy = localStorage.locationHierarchyCams ? JSON.parse(localStorage.locationHierarchyCams) : {};
    if (!Object.keys(locationHierarchy).length) {
      return vxg.api.cloud.getMetaTag(vxg.user.src.allCamsToken, "Province").then(function (locations) {
        for (const loc in locations) {
          var firstLoc = "province_" + loc.replaceAll(" ", "_");
          locationHierarchy[firstLoc] = {}
        }
        let currentProvince;
        var locationsArr = Object.keys(locationHierarchy);
        if (locationsArr.length == 0) {
          self.onLocationHierarchyLoaded({});
        }
        let promiseChain = Promise.resolve();
        for (let i = 0; i < locationsArr.length; i++) {
          currentProvince = locationsArr[i];

          const makeNextPromise = (currentProvince) => () => {
            return window.vxg.cameras.getCameraListPromise(500, 0, currentProvince, undefined, undefined)
              .then((cameras) => {
                self.getSubLocations(locationHierarchy, 1, cameras, [currentProvince]);
                if (i == locationsArr.length - 1) {
                  window.vxg.cameras.getCameraListPromise(500, 0, undefined, "location,isstorage", undefined).then((noLocs) => {
                    var noLocs_noStorage = noLocs.filter(cam => {
                      return cam.src.meta?.isstorage == undefined
                    });
                    if (noLocs_noStorage.length > 0) localStorage.noLocCams = JSON.stringify(noLocs_noStorage);
                    localStorage.locationHierarchyCams = JSON.stringify(locationHierarchy);
                    self.onLocationHierarchyLoaded(locationHierarchy);
                  })
                }
                return true;
              });
          }
          promiseChain = promiseChain.then(makeNextPromise(currentProvince))
        }
      })
    }
  },
  getSubLocations: function (locationHierarchy, locLevel, cameras, prevLocs) {
    var self = this;
    // have to add the last cams
    if (locLevel == 5) {
      var camsInLocation = cameras.filter(cam => {
        var camInLoc = true;
        prevLocs.forEach(prevLoc => {
          if (cam.src.meta && cam.src.meta[prevLoc] == undefined) camInLoc = false;
        })
        if (camInLoc && cam.src.meta && cam.src.meta[locTypes[locLevel]] == undefined) {
          return cam;
        }
      })

      self.updateObjProp(locationHierarchy, camsInLocation, prevLocs.join(".") + ".cams");
      return {};
    } else {
      // get rid of any cameras that don't have the previous filter
      var newLocsCams = cameras.filter(cam => {
        var inCurrentLoc = true;
        if (cam.src.meta && cam.src.meta[locTypes[locLevel]] == undefined) inCurrentLoc = false;
        prevLocs.forEach(prevLoc => {
          if (cam.src.meta && cam.src.meta[prevLoc] == undefined) {
            inCurrentLoc = false
          }
        })
        if (inCurrentLoc) return cam;
      });

      var camsInLocation = cameras.filter(cam => {
        var camInLoc = true;
        prevLocs.forEach(prevLoc => {
          if (cam.src.meta && cam.src.meta[prevLoc] == undefined) camInLoc = false;
        })
        if (camInLoc && cam.src.meta && cam.src.meta[locTypes[locLevel]] == undefined) {
          return cam;
        }
      })

      self.updateObjProp(locationHierarchy, camsInLocation, prevLocs.join(".") + ".cams");

      if (newLocsCams.length == 0) {
        return {}
      }

      newLocsCams.forEach(cam => {
        // checking if current location is in the hierarchy
        var metaLoc = cam.src.meta ? cam.src.meta[locTypes[locLevel]].replaceAll(" ", "_") : "";
        var currLocName = locTypes[locLevel].toLowerCase() + "_" + metaLoc;
        var currentLocPath = prevLocs.concat(currLocName)
        const currentLoc = currentLocPath.reduce((object, key) => {
          return (object || {})[key];
        }, locationHierarchy);

        if (currentLoc == undefined) {
          self.updateObjProp(locationHierarchy, {}, currentLocPath.join("."));
          return self.getSubLocations(locationHierarchy, locLevel + 1, cameras, currentLocPath);
        }
      });
    }
  },
  updateObjProp: function (obj, value, propPath) {
    const [head, ...rest] = propPath.split('.');

    !rest.length
      ? obj[head] = value
      : this.updateObjProp(obj[head], value, rest.join('.'));
  }
};

function toggleAllLoc() {
  var ele = document.getElementById("locctrl");
  if (ele.checked) $(".locationCheckbox").prop("checked", true);
  else $(".locationCheckbox").prop("checked", false);
}
