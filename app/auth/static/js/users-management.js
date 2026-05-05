$(document).ready(function() {
    $('#nav-tab-user-info').hide();

    (function(next) {
        var user_form = createUserForm('divCreateUser', false);
        $('#divCreateUser').append(user_form);
        next()
    }(function() {
        setUserForm('divCreateUser', PAGE_CTRL, DATA_USERS);
        $('#btn-reset-user').on('click', function() {
            resetUserForm('divCreateUser', PAGE_CTRL, DATA_USERS);
        });
        $('#divCreateUser-btn-submit-user').on('click', function() {
            createUserPost('divCreateUser', PAGE_CTRL, -1);
        });
    }));

    $('#nav-tab-user-list, #btn-refresh-user-list').on('click', function() {
        displayUserList(PAGE_CTRL);
    });
});

function displayUserList(pageCtrl) {
    var endpoint = createEndpoint('auth', 'getUserList');
    $.ajax({
        type: 'POST',
        url: endpoint,
        dataType: 'json',
        contentType: 'application/json',
        success: (json) => {
            if (json.status === -1) {
                flashMessage(json.message, 'error');
                return false;
            }
            $('#divListUser').empty();

            var date = new Date(json.date);
            var divTable = userListTable(json.data, date, pageCtrl);
            $('#divListUser').append(divTable);
            $('td a.userLink').on('click', function() {
                var user = $(this)[0].innerText;
                editUserForm(user, pageCtrl);
            });
        },
        error: (xhr, s, e) => {
            displayAjaxError(xhr, s, e);
        }
    });
}

function userListTable(data, date, pageCtrl) {
    var divTable = $('<div>')
        .addClass('overflow-auto')
        .css({
            'max-height': '60vh',
            'width': '100%'
        });

    var keys = ['username', 'role', 'access', 'expiry', 'email',
        'fullname', 'institution', 'extract', 'analysis'
    ];

    var table = $('<table>').appendTo(divTable)
        .addClass('table table-bordered table-striped table-hover table-responsive');

    var thead = $('<thead>').appendTo(table)
        .addClass('table-primary');
    var row = $('<tr>').appendTo(thead);

    $('<th>').appendTo(row).text('N°');
    for (var kk of keys) {
        $('<th>').appendTo(row)
            .text(pageCtrl.user_form[kk].text);
    }

    var tbody = $('<tbody>').appendTo(table);
    for (i = 0; i < data.length; i++) {
        var row = $('<tr>').appendTo(tbody);

        var udate = new Date(data[i].expiry);
        if (udate < date) {
            row.addClass('table-danger');
        }

        $('<td>').appendTo(row).text(i + 1);
        for (var kk of keys) {
            var txt;
            var vv = data[i][kk];
            if (kk === 'extract') {
                var extract = pageCtrl.extraction_support;
                var k_ext = Object.keys(extract);
                if (data[i].role === 'admin') {
                    txt = '*';
                } else if (k_ext.every(x => vv.includes(x))) {
                    txt = '*';
                } else {
                    txt = vv.map(x => extract[x]);
                    txt = txt.join('; ');
                }
            } else if (kk === 'analysis') {
                var analysis = pageCtrl.analysis;
                var k_anl = Object.keys(analysis);
                if (data[i].role === 'admin') {
                    txt = '*';
                } else if (k_anl.every(x => vv.includes(x))) {
                    txt = '*';
                } else {
                    txt = vv.map(x => analysis[x]);
                    txt = txt.join('; ');
                }
            } else if (kk === 'role') {
                txt = pageCtrl.user_role[vv];
            } else if (kk === 'access') {
                txt = pageCtrl.user_access[vv];
            } else {
                if (kk == 'username') {
                    txt = '<a class="userLink">' + vv + '</a>';
                } else {
                    txt = vv;
                }
            }
            $('<td>').appendTo(row).html(txt);
        }
    }

    return divTable;
}

function changeUserPassword(divParent) {
    var divP = '#' + divParent + '-';
    $(divP + 'user-change-password').on('change', function() {
        $(divP + 'password').prop('disabled', !this.checked);
        $(divP + 'confirm').prop('disabled', !this.checked);
    });
}

function disableUserPassword(divParent) {
    var divP = '#' + divParent + '-';
    $(divP + 'password').prop('disabled', true);
    $(divP + 'confirm').prop('disabled', true);
}

function createUserForm(divParent, changepwd, dataUser = DATA_USERS, pageCtrl = PAGE_CTRL) {
    var divP = divParent + '-';
    var user_form = $('<form>');
    var div1 = $('<div>')
        .appendTo(user_form)
        .addClass('container');
    var table1 = $('<table>')
        .appendTo(div1)
        .addClass('table-register-input');
    var keysText = ['fullname', 'institution', 'email', 'username'];
    for (var key of keysText) {
        var value = pageCtrl.user_form[key];
        var row = $('<tr>').appendTo(table1);
        var td1 = $('<td>').appendTo(row);
        $('<label>').appendTo(td1)
            .attr('for', divP + key).text(value.text);
        var td2 = $('<td>').appendTo(row);
        $('<input>', {
                type: 'text',
                id: divP + key,
                class: key
            }).appendTo(td2)
            .val(dataUser[key]);
    }

    var keysPwd = ['password', 'confirm'];
    for (var key of keysPwd) {
        var value = pageCtrl.user_form[key];
        var row = $('<tr>').appendTo(table1);
        var td1 = $('<td>').appendTo(row);
        $('<label>').appendTo(td1)
            .attr('for', divP + key).text(value.text);
        var td2 = $('<td>').appendTo(row);
        if (changepwd) {
            if (key === 'password') {
                var divpwd = $('<div>').appendTo(td2)
                    .addClass('form-check');
                $('<input>', {
                    type: 'checkbox',
                    id: divP + 'user-change-password',
                    class: 'form-check-input'
                }).appendTo(divpwd);
                $('<label>').appendTo(divpwd)
                    .addClass('form-check-label')
                    .attr('for', divP + 'user-change-password')
                    .text(JS_TEXT.user_from.pwd);
            }
            var pwd_disabled = true;
        } else {
            var pwd_disabled = false;
        }
        $('<input>', {
                type: 'password',
                id: divP + key,
                class: key
            }).appendTo(td2)
            .attr('autocomplete', 'on')
            .prop('disabled', pwd_disabled);
    }

    // 
    var div2 = $('<div>')
        .appendTo(user_form)
        .addClass('container register-user-select');
    var table2 = $('<table>')
        .appendTo(div2)
        .addClass('table-register-select');

    var row = $('<tr>').appendTo(table2);
    var keysText = ['role', 'access', 'expiry'];
    for (var key of keysText) {
        var value = pageCtrl.user_form[key];
        var td1 = $('<td>').appendTo(row);
        $('<label>').appendTo(td1)
            .attr('for', divP + key).text(value.text);
        var td2 = $('<td>').appendTo(row);
        if (key === 'expiry') {
            var i_expiry = $('<input>', {
                    type: 'text',
                    id: divP + key,
                    class: key
                }).appendTo(td2)
                .val(dataUser[key]);
            i_expiry.datepicker({
                dateFormat: 'yy-mm-dd',
                defaultDate: dataUser.expiry,
                minDate: new Date()
            });
        } else {
            var select = $('<select>')
                .attr('id', divP + key)
                .addClass(key)
                .appendTo(td2);
            var data_select = pageCtrl['user_' + key];
            for (var kk in data_select) {
                select.append(
                    $("<option>").text(data_select[kk]).val(kk)
                );
            }
            select.val(dataUser[key]);
        }
    }
    // 
    var div3 = $('<div>')
        .appendTo(user_form)
        .addClass('container register-user-chekbox');
    var divR = $('<div>')
        .appendTo(div3)
        .addClass('row');

    for (var key of ['extract', 'analysis']) {
        var value = pageCtrl.user_form[key];
        if (key === 'extract') {
            var checks = 'extraction_support';
        } else {
            var checks = 'analysis';
        }
        var divC = $('<div>')
            .appendTo(divR)
            .addClass('col border border-dark-subtle rounded-4 overflow-auto register-user-chekbox-div')
            .attr('id', divP + 'div-' + checks);

        $('<label>')
            .appendTo(divC)
            .addClass('register-user-chekbox-label')
            .text(value.text);
        for (var [kk, vv] of Object.entries(pageCtrl[checks])) {
            var divChk = $('<div>')
                .appendTo(divC)
                .addClass('form-check register-user-chekbox-checks');

            var chk = $('<input>', {
                type: 'checkbox',
                id: divP + kk,
                class: 'form-check-input'
            }).appendTo(divChk);
            if (dataUser[key].includes(kk)) {
                chk.prop('checked', true);
            }

            $('<label>')
                .appendTo(divChk)
                .addClass('form-check-label')
                .attr('for', divP + kk)
                .text(vv);
        }
    }
    // 
    if (changepwd) {
        var submit_btn = JS_TEXT.user_from.submit2;
    } else {
        var submit_btn = JS_TEXT.user_from.submit1;
    }
    var div4 = $('<div>')
        .appendTo(user_form)
        .addClass('div-submit-btn');
    $('<button>', {
        type: 'button',
        id: divP + 'btn-submit-user',
        class: 'btn btn-primary btn-submit-user',
        text: submit_btn
    }).appendTo(div4);

    return user_form;
}

function editUserForm(username, pageCtrl) {
    var endpoint = createEndpoint('auth', 'getUserInfo');
    $.ajax({
        dataType: 'json',
        data: { username: username },
        url: endpoint,
        success: (json) => {
            if (json.status === -1) {
                flashMessage(json.message, 'error');
                return false;
            }

            $('#nav-tab-user-info').show();
            $('#divEditUser').empty();

            (function(next) {
                var user_info = createUserForm('divEditUser', true, json.data, pageCtrl);
                $('#divEditUser').append(user_info);
                $('#nav-tab-user-info').get(0).click();

                next()
            }(function() {
                changeUserPassword('divEditUser');
                $('#divEditUser :input').prop('disabled', true);
                setUserForm('divEditUser', pageCtrl, json.data);
                $('#divEditUser-btn-submit-user').on('click', function() {
                    createUserPost('divEditUser', pageCtrl, json.data['uid']);
                });

                $('#btn-edit-user').prop('disabled', false);
                $('#btn-edit-user').off('click');
                $('#btn-edit-user').on('click', function() {
                    $('#divEditUser :input').prop('disabled', false);
                    disableUserPassword('divEditUser');
                });

                $('#btn-delete-user').prop('disabled', false);
                $('#btn-delete-user').off('click');
                $('#modal-delete-user').off('click');
                $('#btn-delete-user').on('click', function() {
                    var txt1 = JS_TEXT.del_user + ': ';
                    var txt2 = ' <strong>' + json.data['username'] + '</strong> ?';
                    $('#ask-delete-user').html(txt1 + txt2);
                    $('#modal-delete-user').on('click', '#btn-delete-user-yes', function() {
                        deleteUser(json.data['uid']);
                    });
                    $('#modal-delete-user').on('click', '#btn-delete-user-no', function() {
                        $('#btn-delete-user').off('click');
                    });
                });
            }));
        },
        error: (xhr, s, e) => {
            displayAjaxError(xhr, s, e);
        }
    });
}

function setUserForm(divParent, pageCtrl, dataUser) {
    var divL = divParent + '-';
    var divP = '#' + divL;
    $(divP + 'role').on('change', function() {
        var role = $(divP + 'role option:selected').val();
        if (role === 'admin') {
            $(divP + 'access').val('all');
            $('label[for="' + divL + 'access"]').hide();
            $(divP + 'access').hide();
            for (var item of ['extraction_support', 'analysis']) {
                for (var kk in pageCtrl[item]) {
                    $(divP + kk).prop('checked', true);
                }
            }
            $(divP + 'expiry').val('2100-01-01');
            $('label[for="' + divL + 'expiry"]').hide();
            $(divP + 'expiry').hide();
            $('#' + divParent + ' .register-user-chekbox').hide();
        } else {
            $(divP + 'access').val(dataUser.access);
            $('label[for="' + divL + 'access"]').show();
            $(divP + 'access').show();
            $(divP + 'expiry').val(dataUser.expiry);
            $('label[for="' + divL + 'expiry"]').show();
            $(divP + 'expiry').show();
            $('#' + divParent + ' .register-user-chekbox').show();
            for (var item of ['extraction_support', 'analysis']) {
                for (var kk in pageCtrl[item]) {
                    var d_item = item == 'analysis' ? 'analysis' : 'extract';
                    var check = dataUser[d_item].includes(kk);
                    $(divP + kk).prop('checked', check);
                }
            }
        }
    });
    $(divP + 'role').trigger('change');
    // 
    $(divP + 'access').on('change', function() {
        var access = $(divP + 'access option:selected').val();
        if (access === 'climatology') {
            for (var kk in pageCtrl.analysis) {
                $(divP + kk).prop('checked', false);
            }
            $(divP + 'div-analysis').hide();
        } else if (access === 'all') {
            $(divP + 'div-analysis').show();
            for (var kk in pageCtrl.analysis) {
                $(divP + kk).prop('checked', true);
            }
        } else {
            $(divP + 'div-analysis').show();
            for (var kk in pageCtrl.analysis) {
                var check = dataUser.analysis.includes(kk);
                $(divP + kk).prop('checked', check);
            }
        }
    });
    $(divP + 'access').trigger('change');
}

function resetUserForm(divParent, pageCtrl, dataUser) {
    $('.required-field').remove();

    var divP = '#' + divParent + '-';
    var ctrlUserForm = Object.entries(pageCtrl.user_form);
    for (var [key, value] of ctrlUserForm) {
        if (['text', 'password'].includes(value.type)) {
            $(divP + key).val('');
        }
        if (key === 'role') {
            $(divP + key).val('user');
        }
        if (key === 'access') {
            $(divP + key).val('climatology');
        }
        if (key === 'expiry') {
            $(divP + key).val(dataUser.expiry);
        }
    }

    for (var kk in pageCtrl.extraction_support) {
        $(divP + kk).prop('checked', false);
    }

    for (var kk in pageCtrl.analysis) {
        $(divP + kk).prop('checked', false);
    }
    $(divP + 'div-analysis').hide();
}

function dispMsgUserForm(parent, text) {
    $('.required-field').remove();

    var msg = $('<ul>').addClass('required-field errors');
    $('<li>').appendTo(msg).html(text);

    msg.insertAfter(parent);
}

function validateUserForm(divParent, pageCtrl) {
    $('.required-field').remove();

    var divP = '#' + divParent + '-';
    var pwdCheckbox = $(divP + 'user-change-password');
    var pwdCheck = true;
    if (pwdCheckbox.length > 0) {
        if (!pwdCheckbox.is(':checked')) {
            pwdCheck = false;
        }
    }

    var inputs = $('#' + divParent + ' .table-register-input input');
    for (i = 0; i < inputs.length; i++) {
        if (inputs[i].type === 'password') {
            if (!pwdCheck) {
                continue;
            }
        }
        if ($.trim(inputs[i].value) == '') {
            var id = '#' + inputs[i].id;
            var text = JS_TEXT.validate.inputs;
            dispMsgUserForm(id, text);
            return false;
        }
    }

    var emailReg = /^([\w-\.]+@([\w-]+\.)+[\w-]{2,4})?$/;
    if (!emailReg.test($(divP + 'email').val())) {
        var text = JS_TEXT.validate.email;
        dispMsgUserForm(divP + 'email', text);
        return false;
    }

    if (pwdCheck) {
        var pwd1 = $(divP + 'password').val();
        var pwd2 = $(divP + 'confirm').val();

        if (pwd1.length < 4) {
            var text = JS_TEXT.validate.pwd1;
            dispMsgUserForm(divP + 'password', text);
            return false;
        }

        if (pwd1 != pwd2) {
            var text = JS_TEXT.validate.pwd2;
            dispMsgUserForm(divP + 'confirm', text);
            return false;
        }
    }

    var expiry = $.trim($(divP + 'expiry').val());
    if (expiry == '') {
        var text = JS_TEXT.validate.expr1;
        // flashMessage(text, 'error');
        dispMsgUserForm(divP + 'expiry', text);
        return false;
    }
    expiry = new Date(expiry);
    expiry.setHours(0, 0, 0, 0);
    var today = new Date();
    today.setHours(0, 0, 0, 0);
    if (expiry < today) {
        var text = JS_TEXT.validate.expr2;
        // flashMessage(text, 'error');
        dispMsgUserForm(divP + 'expiry', text);
        return false;
    }

    var role = $(divP + 'role option:selected').val();
    if (role === 'user') {
        var extract_keys = Object.keys(pageCtrl.extraction_support);
        var extract = extract_keys.map(x => $(divP + 'div-extraction_support ' + divP + x).is(':checked'));
        if (extract.every(x => x === false)) {
            var id = divP + 'div-extraction_support';
            var text = JS_TEXT.validate.xsupp;
            // flashMessage(text, 'error');
            dispMsgUserForm(id, text);
            return false;
        }
    }

    // var access = $(divP + 'access option:selected').val();
    // if (access !== 'climatology') {
    //     var analysis_keys = Object.keys(pageCtrl.analysis);
    //     var analysis = analysis_keys.map(x => $(divP + 'div-analysis ' + divP + x).is(':checked'));
    //     if (analysis.every(x => x === false)) {
    //         var id = divP + 'div-analysis';
    //         var text = 'Analysis: at least one option must be checked.';
    //         // flashMessage(text, 'error');
    //         dispMsgUserForm(id, text);
    //         return false;
    //     }
    // }

    return true;
}

function getDataUserForm(divParent, pageCtrl, userID) {
    if (!validateUserForm(divParent, pageCtrl)) {
        return undefined
    }

    var divP = '#' + divParent + '-';
    var dataUser = new Object();
    dataUser.uid = userID;
    dataUser.fullname = $(divP + 'fullname').val();
    dataUser.institution = $(divP + 'institution').val();
    dataUser.email = $(divP + 'email').val();
    dataUser.username = $(divP + 'username').val();

    if ($(divP + 'user-change-password').length > 0) {
        dataUser.update = true;
        dataUser.newpassword = false;
        if ($(divP + 'user-change-password').is(':checked')) {
            dataUser.newpassword = true;
            dataUser.password = $(divP + 'password').val();
        }
    } else {
        dataUser.update = false;
        dataUser.password = $(divP + 'password').val();
    }

    dataUser.role = $(divP + 'role option:selected').val();
    dataUser.access = $(divP + 'access option:selected').val();
    dataUser.expiry = $(divP + 'expiry').val();

    var extract_keys = Object.keys(pageCtrl.extraction_support);
    var extract = extract_keys.filter(x => $(divP + 'div-extraction_support ' + divP + x).is(':checked'));
    dataUser.extract = extract;

    var analysis_keys = Object.keys(pageCtrl.analysis);
    var analysis = analysis_keys.filter(x => $(divP + 'div-analysis ' + divP + x).is(':checked'));
    dataUser.analysis = analysis;

    return dataUser;
}

function createUserPost(divParent, pageCtrl, userID) {
    var dataUser = getDataUserForm(divParent, pageCtrl, userID);
    if (dataUser === undefined) {
        return false;
    }
    attachModalUserReply(divParent, dataUser);
    var endpoint = createEndpoint('auth', 'createUser');
    $.ajax({
        type: 'POST',
        url: endpoint,
        dataType: 'json',
        data: JSON.stringify(dataUser),
        contentType: 'application/json',
        success: (json) => {
            flashMessage(json.message, json.code);
            if (json.status === 0) {
                showModalUserReply(json.user, pageCtrl);
            }
        },
        error: (xhr, s, e) => {
            displayAjaxError(xhr, s, e);
        }
    });
}

function displayUserReply(dataUser, pageCtrl) {
    var divReply = $('<div>')
        .addClass('container-fluid overflow-auto')
        .css('height', '60vh');
    var divTmp = $('<div>').appendTo(divReply);
    var ul = $('<ul>').addClass('list-group').appendTo(divTmp);
    var keyForm = ['username', 'email', 'fullname', 'institution'];
    for (var key of keyForm) {
        $('<li>').addClass('list-group-item').appendTo(ul)
            .html('<strong>' + pageCtrl.user_form[key].text +
                ':</strong> ' + dataUser[key]);
    }
    // 
    $('<hr>').appendTo(divReply);
    var divTmp = $('<div>').appendTo(divReply);
    var ul = $('<ul>').addClass('list-group').appendTo(divTmp);
    for (var key of ['role', 'access', 'expiry']) {
        if (key === 'role') {
            var valRole = pageCtrl.user_role[dataUser[key]];
        } else if (key === 'access') {
            var valRole = pageCtrl.user_access[dataUser[key]];
        } else {
            var valRole = dataUser[key];
        }
        $('<li>').addClass('list-group-item').appendTo(ul)
            .html('<strong>' + pageCtrl.user_form[key].text +
                ':</strong> ' + valRole);
    }
    // 
    $('<hr>').appendTo(divReply);
    var divTmp = $('<div>').appendTo(divReply);
    $('<p>').appendTo(divTmp)
        .html('<strong>' + pageCtrl.user_form['extract'].text +
            ':</strong>');
    var ul = $('<ul>').appendTo(divTmp)
        .css('list-style-type', 'square');
    for (var key of dataUser['extract']) {
        $('<li>').appendTo(ul)
            .html(pageCtrl.extraction_support[key]);
    }
    // 
    if (dataUser['analysis'].length > 0) {
        $('<hr>').appendTo(divReply);
        var divTmp = $('<div>').appendTo(divReply);
        $('<p>').appendTo(divTmp)
            .html('<strong>' + pageCtrl.user_form['analysis'].text +
                ':</strong>');
        var ul = $('<ul>').appendTo(divTmp)
            .css('list-style-type', 'square');
        for (var key of dataUser['analysis']) {
            $('<li>').appendTo(ul)
                .html(pageCtrl.analysis[key]);
        }
    }

    return divReply;
}

function createModalUserReply(title) {
    var divModal = $('<div>')
        .addClass('modal fade')
        .attr('id', 'user-creation-reply')
        .attr('tabindex', '-1')
        .css('width', '70%');
    var divTmp = $('<div>')
        .addClass('vertical-alignment-helper')
        .appendTo(divModal);
    var divDialog = $('<div>')
        .addClass('modal-dialog modal-dialog-centered')
        .addClass('vertical-align-center')
        .appendTo(divTmp);
    var divContent = $('<div>')
        .addClass('modal-content')
        .appendTo(divDialog);

    var divHeader = $('<div>')
        .addClass('modal-header')
        .appendTo(divContent);
    $('<h4>').text(title)
        .addClass('modal-title')
        .appendTo(divHeader);

    $("<button>", {
        type: 'button',
        class: 'btn-close',
        'data-bs-dismiss': 'modal',
        'aria-label': 'Close'
    }).appendTo(divHeader);

    var divBody = $('<div>')
        .addClass('modal-body')
        .appendTo(divContent);
    $('<div>').attr('id', 'divCreateUserReply')
        .appendTo(divBody);

    return divModal;
}

function attachModalUserReply(divParent, dataUser) {
    if (dataUser.update) {
        var title = JS_TEXT.reply.title1;
    } else {
        var title = JS_TEXT.reply.title2;
    }
    $('#user-creation-reply').remove();
    var divP = $('#' + divParent);
    var modal_div = createModalUserReply(title);
    var modal_parent = divP.parent().parent().attr('id');
    $('#' + modal_parent).append(modal_div);
}

function showModalUserReply(dataUser, pageCtrl) {
    $('#divCreateUserReply').empty();
    var divReply = displayUserReply(dataUser, pageCtrl);
    $('#divCreateUserReply').append(divReply);
    var modal_div = document.getElementById('user-creation-reply');
    var modal_reply = new bootstrap.Modal(modal_div, {});
    modal_reply.show();
}

function deleteUser(uid) {
    var endpoint = createEndpoint('auth', 'deleteUser');
    $.ajax({
        type: 'POST',
        url: endpoint,
        dataType: 'json',
        data: JSON.stringify({ uid: uid }),
        contentType: 'application/json',
        success: (json) => {
            flashMessage(json.message, json.code);
            $('#divEditUser-btn-submit-user').hide();
        },
        error: (xhr, s, e) => {
            displayAjaxError(xhr, s, e);
        }
    }).always(function() {
        $('#btn-edit-user').prop('disabled', true);
        $('#btn-delete-user').prop('disabled', true);
    });
}