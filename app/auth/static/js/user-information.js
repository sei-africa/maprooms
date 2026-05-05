function userAccount(dataUser, pageCtrl) {
    var divUser = $('<div>');
    var table = $('<table>').css({
        'border-collapse': 'separate',
        'border-spacing': '20px 5px'
    });

    var keysText = ['username', 'email', 'fullname',
        'institution', 'role', 'access', 'expiry'
    ];
    for (var key of keysText) {
        var row = $('<tr>');
        var label = pageCtrl.user_form[key].text;
        var value = dataUser[key];
        if (['role', 'access'].includes(key)) {
            var value = pageCtrl['user_' + key][value];
        }
        $('<td>').text(label).css('font-weight', 'bold').appendTo(row);
        $('<td>').text(value).appendTo(row);
        table.append(row);
    }

    var row = $('<tr>');
    var label = pageCtrl.user_form['extract'].text;
    $('<td>').text(label).css('font-weight', 'bold').appendTo(row);
    var tbL = $('<td>').appendTo(row);
    var ul = $('<ul>').appendTo(tbL).css('list-style-type', 'square');
    for (var key of dataUser['extract']) {
        $('<li>').appendTo(ul)
            .html(pageCtrl.extraction_support[key]);
    }
    table.append(row);

    if (dataUser['analysis'].length > 0) {
        var row = $('<tr>');
        var label = pageCtrl.user_form['analysis'].text;
        $('<td>').text(label).css('font-weight', 'bold').appendTo(row);
        var tbL = $('<td>').appendTo(row);
        var ul = $('<ul>').appendTo(tbL).css('list-style-type', 'square');
        for (var key of dataUser['analysis']) {
            $('<li>').appendTo(ul)
                .html(pageCtrl.analysis[key]);
        }
        table.append(row);
    }

    var row = $('<tr>');
    $('<td>').text(JS_TEXT.api.key).css('font-weight', 'bold').appendTo(row);
    $('<td>').attr('id', 'api-key').text(dataUser.api_key).appendTo(row);

    var td_api = $('<td>').appendTo(row);
    $('<button>', {
        type: 'button',
        'class': 'btn btn-primary',
        text: JS_TEXT.api.btn,
        click: () => {
            generate_api_key(dataUser.username);
        }
    }).appendTo(td_api);
    table.append(row);

    divUser.append(table);

    return divUser;
}

function display_message(parent, text) {
    $('.required-field').remove();
    var msg = $('<ul>').addClass('required-field errors');
    $('<li>').appendTo(msg).html(text);

    msg.insertAfter(parent);
}

function validate_password() {
    var pwd1 = $('#password').val();
    var pwd2 = $('#confirm').val();

    if (pwd1.length < 4) {
        display_message('#password', JS_TEXT.valid_pwd.length);
        return false;
    }

    if (pwd1 != pwd2) {
        display_message('#confirm', JS_TEXT.valid_pwd.equal);
        return false;
    }

    return true;
}

function generate_api_key(username) {
    var endpoint = createEndpoint('auth', 'new_api_key');
    $.ajax({
        dataType: 'json',
        data: { username: username },
        url: endpoint,
        success: (json) => {
            $('#api-key').text(json.api_key);
            flashMessage(JS_TEXT.api_key, 'success');
        },
        error: (xhr, s, e) => {
            displayAjaxError(xhr, s, e);
        }
    });
}

function changePasswordPost() {
    var form_ok = validate_password();
    if (!form_ok) {
        return false;
    }
    $('.required-field').remove();

    var data = {
        'username': DATA_USERS.username,
        'password': $('#password').val()
    }

    var endpoint = createEndpoint('auth', 'change_password');
    $.ajax({
        type: 'POST',
        url: endpoint,
        data: JSON.stringify(data),
        contentType: 'application/json',
        dataType: 'json',
        success: (json) => {
            flashMessage(json.message, json.status);
            $('#password').val('');
            $('#confirm').val('');
        },
        error: (xhr, s, e) => {
            displayAjaxError(xhr, s, e);
        }
    });
}