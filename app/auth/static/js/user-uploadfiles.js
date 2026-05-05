function checkUserFile(file, filetype, upload) {
    if (file === undefined) {
        if (upload) {
            flashMessage(JS_TEXT.upload.check1, 'error');
        }
        return false;
    }
    if (filetype === 'geojson') {
        var file_type = ['application/json', 'application/geo+json', 'application/vnd.geo+json'];
        var msg = JS_TEXT.upload.check2;
    } else if (filetype === 'multipoints') {
        var file_type = ['text/csv'];
        var msg = JS_TEXT.upload.check3;
    } else {
        return false;
    }

    if (!file_type.includes(file.type)) {
        flashMessage(msg, 'error');
        return false;
    }
    return true;
}

function getSHPLayerExts(files) {
    var fext = [];
    var fname = [];
    for (i = 0; i < files.length; i++) {
        var fn = files[i].name;
        var ix = fn.lastIndexOf('.');
        var nm = fn.substr(0, ix);
        var ex = fn.substr(ix + 1);
        // var ex = fn.split('.').pop();
        fext.push(ex);
        fname.push(nm);
    }
    return { 'names': fname, 'exts': fext };
}

function checkSHPLayer(files, upload) {
    if (files.length == 0) {
        if (upload) {
            flashMessage(JS_TEXT.upload.check1, 'error');
        }
        return false;
    }

    if (!upload) {
        var dt = $('<dl>');
        for (i = 0; i < files.length; i++) {
            $('<dt>').text(files[i].name).appendTo(dt);
        }
        $('#selectedUserFiles').append(dt);
    }

    var msg4files = JS_TEXT.upload.check4;
    if (files.length != 4) {
        flashMessage(msg4files, 'error');
        $('#selectedUserFiles').empty();
        return false;
    }

    fnmex = getSHPLayerExts(files);
    var exts_list = ['shp', 'shx', 'dbf', 'prj'];
    var allExts = fnmex.exts.every(v => exts_list.includes(v));
    if (!allExts) {
        flashMessage(msg4files, 'error');
        $('#selectedUserFiles').empty();
        return false;
    }

    var allEquals = arr => arr.every(v => v === arr[0]);
    if (!allEquals(fnmex.names)) {
        flashMessage(JS_TEXT.upload.check5, 'error');
        $('#selectedUserFiles').empty();
        return false;
    }

    return true
}

function uploadUserFiles(colname, multiple) {
    $('#uploadUserFile-' + colname).on('change', function() {
        var files = this.files;
        if (multiple) {
            $('#selectedUserFiles').empty();
            var ret = checkSHPLayer(files, false);
            if (!ret) return false;
            var ufile = getSHPLayerExts(files).names[0]
            var msg = `${JS_TEXT.upload.up1} `;
        } else {
            ret = checkUserFile(files[0], colname, false);
            if (!ret) return false;
            var ufile = files[0].name;
            var msg = `${JS_TEXT.upload.up2} `;
        }

        if (DATA_USERS[colname].indexOf(ufile) !== -1) {
            msg = `${msg}${ufile} ${JS_TEXT.upload.up3}\n${JS_TEXT.upload.up4}`;

            if (!confirm(msg)) {
                if (multiple) $('#selectedUserFiles').empty();
                $('#uploadUserFile-' + colname).val(null);
                return false;
            }
        }
    });

    $('#uploadUserBtn-' + colname).on('click', () => {
        var files = $('#uploadUserFile-' + colname).prop('files');
        if (multiple) {
            var ret = checkSHPLayer(files, true);
        } else {
            ret = checkUserFile(files[0], colname, true);
        }
        if (!ret) return false;

        var data = new FormData();
        if (multiple) {
            var ufile = getSHPLayerExts(files).names[0]
            for (var i = 0; i < files.length; i++) {
                data.append('filesUser', files[i]);
            }
        } else {
            var ufile = files[0].name;
            data.append('filesUser', files[0]);
        }
        data.append('colname', colname);

        var endpoint = createEndpoint('auth', 'upload_user_files');
        $.ajax({
            type: 'POST',
            url: endpoint,
            data: data,
            cache: false,
            contentType: false,
            processData: false,
            dataType: 'json',
            success: (json) => {
                if (json.status == 'success') {
                    var userfiles = DATA_USERS[colname];
                    userfiles.push(ufile);
                    userfiles = arrayRemoveDuplicates(userfiles);
                    DATA_USERS[colname] = userfiles;
                    userDataFilesTable(userfiles, colname);
                    if (multiple) $('#selectedUserFiles').empty();
                    $('#uploadUserFile-' + colname).val(null);
                }
                flashMessage(json.message, json.status);
            },
            error: (xhr, s, e) => {
                displayAjaxError(xhr, s, e);
            },
            beforeSend: () => {
                $('#uploadUserPb-' + colname).show();
            },
            xhr: () => {
                var vxhr = $.ajaxSettings.xhr();
                if (vxhr.upload) {
                    vxhr.upload.addEventListener('progress', (e) => {
                        if (e.lengthComputable) {
                            var prc = Math.ceil((100 * e.loaded) / e.total);
                            $('#uploadUserStatus-' + colname).text(prc + '%');
                            $('#uploadUserPb-' + colname).attr({
                                value: e.loaded,
                                max: e.total,
                            });
                        }
                    }, false);
                }
                return vxhr;
            }
        }).always(() => {
            $('#uploadUserPb-' + colname).hide();
            $('#uploadUserStatus-' + colname).empty();
        });
    });
}