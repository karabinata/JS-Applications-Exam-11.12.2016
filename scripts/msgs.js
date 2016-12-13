function startApp() {

    showHideMenuLinks();

    showHideViews();

    hideInfoMsgs();

    if (!sessionStorage.getItem('username')) {
        viewAppHome();
    } else {
        viewUserHome();
    }

    $(document).on({
        ajaxStart: function () {
            $('#loadingBox').show()
        },
        ajaxStop: function () {
            $('#loadingBox').hide()
        }
    });

    $('#infoBox, #errorBox').click(function () {
        $(this).fadeOut();
    });

    $('#linkMenuAppHome').click(viewAppHome);
    $('#linkMenuLogin').click(viewLogin);
    $('#linkMenuRegister').click(viewRegister);

    $('#linkMenuUserHome').click(viewUserHome);
    $('#linkMenuArchiveSent').click(viewArchiveSent);
    $('#linkMenuMyMessages').click(viewMyMessages);
    $('#linkMenuSendMessage').click(viewSendMessage);
    $('#linkUserHomeMyMessages').click(viewMyMessages);
    $('#linkUserHomeArchiveSent').click(viewArchiveSent);
    $('#linkUserHomeSendMessage').click(viewSendMessage);
    $('#linkMenuLogout').click(logoutUser);

    $('#formRegister').submit(registerUser);
    $('#formLogin').submit(loginUser);
    $('#formSendMessage').submit(submitNewMsg);

    function escapeHtml(text) {
        return text.replace(/[\"&<>]/g, function (a) {
            return {'"': '&quot;', '&': '&amp;', '<': '&lt;', '>': '&gt;'}[a];
        });
    }

    function showHideMenuLinks() {
        $('#menu > a, #menu>span').hide();

        if (!sessionStorage.getItem('username')) {
            $('#linkMenuAppHome').show();
            $('#linkMenuLogin').show();
            $('#linkMenuRegister').show();
        } else {
            $('#linkMenuUserHome').show();
            $('#linkMenuArchiveSent').show();
            $('#linkMenuMyMessages').show();
            $('#linkMenuSendMessage').show();
            $('#linkMenuLogout').show();
            $('#spanMenuLoggedInUser').text('Welcome, ' + sessionStorage.getItem('username') + '!').show();
        }
    }

    function hideInfoMsgs() {
        $('#infoBox, #errorBox, #loadingBox').hide();
    }

    function showHideViews() {
        $('main > section').hide();
    }

    function showView(view) {
        $('#' + view).show();
    }

    function viewAppHome() {
        showHideViews();
        showView('viewAppHome');
    }

    function viewLogin() {
        showHideViews();
        showView('viewLogin');
    }

    function viewRegister() {
        showHideViews();
        showView('viewRegister');
    }

    function viewUserHome() {
        showHideViews();
        showView('viewUserHome');
        $('#viewUserHomeHeading').text(`Welcome, ${sessionStorage.getItem('username')}!`);
    }

    function viewArchiveSent() {
        showHideViews();
        showView('viewArchiveSent');

        loadArchiveSendMsgs('kinvey');
    }

    function viewMyMessages() {
        showHideViews();
        showView('viewMyMessages');

        loadAllReceivedMsgs('kinvey');
    }

    function viewSendMessage() {
        showHideViews();
        showView('viewSendMessage');

        loadSendMsgsForm('kinvey');
    }

    function showInfo(msg) {
        $('#infoBox').text(msg).show();
        setTimeout(function () {
            $('#infoBox').fadeOut();
        }, 3000);
    }

    function showError(errMsg) {
        $('#errorBox').text(errMsg).show();
    }

    const baseUrl = "https://baas.kinvey.com/";
    const appKey = "kid_Hk-CodcXg";
    const appSecret = "329536bd2c474a33a4b29f66cbbad666";

    function saveUserCredentials(userInfo) {
        let username = userInfo.username;
        sessionStorage.setItem('username', username);
        let authToken = userInfo._kmd.authtoken;
        sessionStorage.setItem('authtoken', authToken);
        let userId = userInfo._id;
        sessionStorage.setItem('userId', userId);
        let name = userInfo.name;
        sessionStorage.setItem('name', name);
    }

    function saveHeaders(auth) {
        let headers = '';
        if (auth === 'basic') {
            headers = {
                'Authorization': 'Basic ' + btoa(appKey + ":" + appSecret)
            }
        } else if (auth === 'kinvey') {
            headers = {
                'Authorization': 'Kinvey ' + sessionStorage.getItem('authtoken')
            }
        }

        return headers;
    }

    function registerUser(event) {
        event.preventDefault();
        register('basic');
    }

    function register(auth) {
        let headers = saveHeaders(auth);
        let userData = {
            username: escapeHtml($('#registerUsername').val()),
            password: escapeHtml($('#registerPasswd').val()),
            name: escapeHtml($('#registerName').val())
        };
        $.post({
            url: baseUrl + `user/${appKey}`,
            headers: headers,
            data: JSON.stringify(userData),
            contentType: 'application/json'
        })
            .then(registerSuccess)
            .catch(ajaxError);

        function registerSuccess(userInfo) {
            showHideViews();
            saveUserCredentials(userInfo);
            viewUserHome();
            showInfo('Registration successful');
            showHideMenuLinks();
        }
    }

    function loginUser(event) {
        event.preventDefault();
        login('basic');
    }

    function login(auth) {
        let headers = saveHeaders(auth);
        let userData = {
            username: escapeHtml($('#loginUsername').val()),
            password: escapeHtml($('#loginPasswd').val())
        };
        $.post({
            url: baseUrl + `user/${appKey}/login`,
            headers: headers,
            data: JSON.stringify(userData),
            contentType: 'application/json'
        })
            .then(loginSuccess)
            .catch(ajaxError);

        function loginSuccess(userInfo) {
            showHideViews();
            saveUserCredentials(userInfo);
            viewUserHome();
            showInfo('Login successful');
            showHideMenuLinks();
        }
    }

    function logoutUser() {
        logout('kinvey');
    }

    function logout(auth) {
        let headers = saveHeaders(auth);

        $.post({
            url: baseUrl + `user/${appKey}/_logout`,
            headers: headers
        })
            .then(logoutSuccess)
            .catch(ajaxError);

        function logoutSuccess() {
            sessionStorage.clear();
            showHideMenuLinks();
            showHideViews();
            viewAppHome();
            showInfo('Logout successful');
        }
    }

    function formatDate(dateISO8601) {
        let date = new Date(dateISO8601);
        if (Number.isNaN(date.getDate()))
            return '';
        return date.getDate() + '.' + padZeros(date.getMonth() + 1) +
            "." + date.getFullYear() + ' ' + date.getHours() + ':' +
            padZeros(date.getMinutes()) + ':' + padZeros(date.getSeconds());

        function padZeros(num) {
            return ('0' + num).slice(-2);
        }
    }

    function formatSender(name, username) {
        if (!name)
            return username;
        else
            return username + ' (' + name + ')';
    }

    function loadAllReceivedMsgs(auth) {
        $.get({
            url: baseUrl + `appdata/${appKey}/messages?query={"recipient_username":"${sessionStorage.getItem('username')}"}`,
            headers: saveHeaders(auth)
        })
            .then(getMsgsSuccess)
            .catch(ajaxError);

        function getMsgsSuccess(msgs) {
            showInfo('Messages loaded.');

            $('#myMessages').empty();

            let table = $(`
                <table>
                    <thead>
                        <tr>
                            <th>From</th>
                            <th>Message</th>
                            <th>Date Received</th>
                        </tr>
                    </thead>
                </table>
                `);
            if (msgs != undefined) {
                let tBody = $('<tbody>');
                for (let msg of msgs) {
                    let tr = $(`<tr>
                            <td>${formatSender(msg.sender_name, msg.sender_username)}</td>
                            <td>${msg.text}</td>
                            <td>${formatDate(msg._kmd.lmt)}</td>
                           `
                    );
                    tBody.append(tr);
                }
                table.append(tBody);
            }
            $('#myMessages').append(table);
        }
    }

    function loadArchiveSendMsgs(auth) {
        $.get({
            url: baseUrl + `appdata/${appKey}/messages?query={"sender_username":"${sessionStorage.getItem('username')}"}`,
            headers: saveHeaders(auth)
        })
            .then(getSendedMsgsSuccess)
            .catch(ajaxError);

        function getSendedMsgsSuccess(msgs) {
            showInfo('Sended messages loaded.');

            $('#sentMessages').empty();

            let table = $(`
                <table>
                    <thead>
                        <tr>
                            <th>To</th>
                            <th>Message</th>
                            <th>Date Sent</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                </table>
                `);
            if (msgs != undefined) {
                let tBody = $('<tbody>');
                for (let msg of msgs) {
                    let btn = $(`<button type="button">Delete</button>`).click(function () {
                        delSendedMsg('kinvey', msg._id)
                    });
                    let tr = $(`<tr>
                            <td>${msg.recipient_username}</td>
                            <td>${msg.text}</td>
                            <td>${formatDate(msg._kmd.lmt)}</td>
                           `
                    );
                    let td = $('<td>');
                    td.append(btn);
                    tr.append(td);
                    tBody.append(tr);
                }
                table.append(tBody);
            }
            $('#sentMessages').append(table);
        }

        function delSendedMsg(auth, msgId) {
            let headers = saveHeaders(auth);

            $.ajax({
                method: "DELETE",
                url: baseUrl + `appdata/${appKey}/messages/${msgId}`,
                headers: headers
            })
                .then(deleteSuccess)
                .catch(ajaxError);

            function deleteSuccess() {
                showInfo('Delete successful.');

                viewArchiveSent();
            }
        }
    }

    function loadSendMsgsForm(auth) {
        $.get({
            url: baseUrl + `user/${appKey}/`,
            headers: saveHeaders(auth)
        })
            .then(getUsersSuccess)
            .catch(ajaxError);

        function getUsersSuccess(users) {
            $('#msgRecipientUsername').empty();

            for (user of users) {
                let option = $(`<option value="${user.username}">${user.username} (${user.name || null})</option>`);

                option.appendTo($('#msgRecipientUsername'));
            }
        }
    }

    function submitNewMsg(event) {
        event.preventDefault();
        sendNewMsg('kinvey');
    }

    function sendNewMsg(auth) {
        let headers = saveHeaders(auth);
        let recipientUsername = $('#msgRecipientUsername').val();
        let msgText = escapeHtml($('#msgText').val());

        let msgBody = {
            "sender_username": sessionStorage.getItem('username'),
            "sender_name": sessionStorage.getItem('name'),
            "recipient_username": recipientUsername,
            "text": msgText
        };

        $.ajax({
            method: "POST",
            url: baseUrl + `appdata/${appKey}/messages/`,
            headers: headers,
            data: JSON.stringify(msgBody),
            contentType: 'application/json'
        })
            .then(sendMsgSuccess)
            .catch(ajaxError);

        function sendMsgSuccess() {
            showInfo('Message send successful.');

            viewArchiveSent();
        }
    }

    function ajaxError(response) {
        let errorMsg = JSON.stringify(response);
        if (response === 0) {
            errorMsg = 'Cannot connect due to network error';
        }
        if (response.responseJSON && response.responseJSON.description) {
            errorMsg = response.responseJSON.description;
        }
        showError(errorMsg);
    }
}