/////////////////////////// Chat App with JS /////////////////////////////

///////// Global Variables//////////// 
var currentUserKey = "";
var chatKey = "";
var friend_id = '';
////////////////////////////// 
document.addEventListener('keydown', function (key) {
    if (key.which === 13) {
        sendMessage()
    }
})


//////////////// Send Icon ////////////////

function ChangeSendIcon(control) {
    if (control.value !== '') {
        document.getElementById('send').removeAttribute('style');
        document.getElementById('audio').setAttribute('style', 'display:none');
    }
    else {
        document.getElementById('audio').removeAttribute('style');
        document.getElementById('send').setAttribute('style', 'display:none');
    }
}


/////////////////////////////////////////////
// Audio record

let chunks = [];
let recorder;
var timeout;

function record(control) {
    let device = navigator.mediaDevices.getUserMedia({ audio: true });
    device.then(stream => {
        if (recorder === undefined) {
            recorder = new MediaRecorder(stream);
            recorder.ondataavailable = e => {
                chunks.push(e.data);

                if (recorder.state === 'inactive') {
                    let blob = new Blob(chunks, { type: 'audio/webm' });
                    document.getElementById('audio').innerHTML = '<source src="' + URL.createObjectURL(blob) + '" type="video/webm" />'; //;
                    var reader = new FileReader();

                    reader.addEventListener("load", function () {
                        var chatMessage = {
                            userId: currentUserKey,
                            msg: reader.result,
                            msgType: 'audio',
                            dateTime: new Date().toLocaleString()
                        };

                        firebase.database().ref('chatMessages').child(chatKey).push(chatMessage, function (error) {
                            if (error) alert(error);
                            else {

                                document.getElementById('txtMessage').value = '';
                                document.getElementById('txtMessage').focus();
                            }
                        });
                    }, false);

                    reader.readAsDataURL(blob);
                }
            }

            recorder.start();
            control.setAttribute('class', 'fas fa-stop fa-2x');
        }
    });

    if (recorder !== undefined) {
        if (control.getAttribute('class').indexOf('stop') !== -1) {
            recorder.stop();
            control.setAttribute('class', 'fas fa-microphone fa-2x');
        }
        else {
            chunks = [];
            recorder.start();
            control.setAttribute('class', 'fas fa-stop fa-2x');
        }
    }
}
 
/////////////////////////////////////    Start Chat with friends /////////////////////
function startChat(friendKey, friendName, friendPhoto) {
    var friendList = {
        friendId: friendKey,
        userId: currentUserKey,
    }
    friend_id = friendKey;
    var db = firebase.database().ref("friend_list")
    var flag = false
    db.on("value", function (friends) {
        friends.forEach(function (data) {
            var user = data.val()
            if ((user.friendId === friendList.friendId && user.userId === friendList.userId) || (user.friendId === friendList.userId && user.userId === friendList.friendId)) {
                flag = true
                chatKey = data.key
            }
        })
        if (flag === false) {
            chatKey = firebase.database().ref("friend_list").push(friendList, function (error) {
                if (error) {
                    alert(error)
                } else {
                    document.getElementById("chatPanel").classList.remove("hide")
                    document.getElementById("divStart").classList.add("hide")
                    hideChatList()
                }
            }).getKey()
        } else {
            document.getElementById("chatPanel").classList.remove("hide")
            document.getElementById("divStart").classList.add("hide")
            hideChatList()
        }
        /////////////////////////////////// Show Friend Name And photo /////////////////
      
        document.getElementById("divChatName").innerHTML = friendName
        document.getElementById("imgChat").src = friendPhoto
        document.getElementById("messages").innerHTML = ""
        //////////////////////////////////////////
        // display chat messages
        loadChatMessages(chatKey,friendPhoto)
    })
}
// display chat messages
function loadChatMessages(chatKey, friendPhoto) {
    var db = firebase.database().ref("chatMessage").child(chatKey)
    db.on("value", function (chats) {
        var messageDisplay = ""
        chats.forEach(function (data) {
            var chat = data.val()
            var dateTime = chat.dateTime.split(",")
            var msg = ""
            if (chat.msgType === "image") {
                msg = `<img src = "${chat.msg}" class="img-fluid" />`
            }
            else if (chat.msgType === 'audio') {
                msg = `<audio controls>
                        <source src="${chat.msg}" type="video/webm" />
                    </audio>`;
            }
             else {
                msg = chat.msg
            }
            if (chat.userId !== currentUserKey) {
                messageDisplay += `<div class="row">
                                    <div class="col-2 col-sm-1 col-md-1">
                                        <img class="chatPic rounded-circle" src="${friendPhoto}" alt="">
                                    </div>
                                    <div class="col-5 col-sm-7 col-md-7">
                                        <p class="recive">
                                           ${msg}
                                           <span class="time float-right" title = "${dateTime[0]}">${dateTime[1]}</span>
                                        </p>
                                    </div>
                                  </div>`
            } else {
                messageDisplay += `<div class="row justify-content-end">
                                    <div class="col-6 col-sm-7 col-md-7 ">
                                        <p class="send float-right">
                                            ${msg}
                                            <span class="time float-right" title = "${dateTime[0]}">${dateTime[1]}</span>
                                        </p>
                                    </div>
                                    <div class="col-2 col-sm-1 col-md-1">
                                         <img class="chatPic rounded-circle" src="${firebase.auth().currentUser.photoURL}" alt="">
                                    </div>
                                  </div>`
            }
        })
        document.getElementById("")
        document.getElementById("messages").innerHTML = messageDisplay;
        document.getElementById("messages").scrollTo(0, document.getElementById("messages").scrollHeight)
    })
}



///////////////////////////////// Show Chats ////////////

function showChatList() {
    document.getElementById("side1").classList.remove('d-md-block', 'd-none')
    document.getElementById("side2").classList.add("hide")
}
function hideChatList() {
    document.getElementById("side1").classList.add('d-md-block', 'd-none')
    document.getElementById("side2").classList.remove("hide")
}
/////////// Send Messages/////////
function sendMessage() {
    var chatMessage = {
        userId: currentUserKey,
        msgType: "normal/text",
        msg: document.getElementById("txtMessage").value,
        dateTime: new Date().toLocaleString(),
    }
    firebase.database().ref("chatMessage").child(chatKey).push(chatMessage, function (error) {
        if (error) {
            alert(error)
        } else {
            firebase.database().ref('fcmTokens').child(friend_id).once('value').then(function (data) {
                $.ajax({
                    url: 'https://fcm.googleapis.com/fcm/send',
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': 'key=AAAAFcWWgVA:APA91bFMdpOWqJ5fUGFGfnCToqT7ZaAfcPomQBx37PMo5A6l0HWpobe8ludMQzivnuj1IIRSOlaK4EoBO9WFHJSNhKOXzS1aNs3S6AzadMUBf6tW281SeQt2yp3B9b7NbUsh2XynbZgQ'
                    },
                    data: JSON.stringify({
                        'to': data.val().token_id, 'data': { 'message': chatMessage.msg.substring(0, 30) + '...', 'icon': firebase.auth().currentUser.photoURL }
                    }),
                    success: function (response) {
                        console.log(response);
                    },
                    error: function (xhr, status, error) {
                        console.log(xhr.error);
                    }
                });
            });
            document.getElementById("txtMessage").value = ""
            document.getElementById('txtMessage').focus();

        }
    })
}
////////////////Send Image Function

function chooseImage() {
    document.getElementById("imgFile").click()
}
function sendImage(event) {
    var file = event.files[0]
    if (!file.type.match("image.*")) {
        alert("Please select image only.");
    } else {
        // alert("corect")
        var reader = new FileReader()

        reader.addEventListener("load", function () {
            // alert(reader.result)
            var chatMessage = {
                userId: currentUserKey,
                msgType: "image",
                msg: reader.result,
                dateTime: new Date().toLocaleString()
            }
            firebase.database().ref("chatMessage").child(chatKey).push(chatMessage, function (error) {
                if (error) {
                    alert(error)
                } else {
                    document.getElementById("txtMessage").value = ""
                    document.getElementById("txtMessage").focus()
                }
            })
        }, false)
        if (file) {
            reader.readAsDataURL(file)
        }
    }
}
/////////////////////////////////// Load chat History /////////////////////////

function loadChatList() {
    var db = firebase.database().ref("friend_list")
    db.on("value", function (lists) {
        document.getElementById("lstChat").innerHTML = `<li class="list-group-item" style="background-color:#f8f8f8">
                                                         <input type="text" placeholder="Seach Here" class="form-control form-rounded">
                                                        </li>`
        lists.forEach(function (data) {
            var lst = data.val()
            var friendKey = ""
            if (lst.friendId === currentUserKey) {
                friendKey = lst.userId
            } else if (lst.userId === currentUserKey) {
                friendKey = lst.friendId
            }
            if (friendKey !== '') {
                firebase.database().ref("users").child(friendKey).on("value", function (data) {
                    var user = data.val()
                    document.getElementById("lstChat").innerHTML += `<li class="list-group-item list-group-item-action"
                     onclick="startChat('${data.key}','${user.name}','${user.photoURL}')">
                    <div class="row">
                        <div class="col-2 col-sm-2 col-md-2 col-lg-2">
                            <img class="rounded-circle FriendPic" src="${user.photoURL}" alt="">
                        </div>
                        <div class="col-10 col-sm-10 col-md-10 col-lg-10" style="cursor: pointer;">
                            <div class="name">${user.name}</div>
                            <div class ="under-name">This is some message text....</div>
                        </div>
                    </div>
                </li>`
                })
            }

        })
    })
}
///// Friend Requests (All Users)

function PopulateUserList() {
    document.getElementById('lstUsers').innerHTML = `<div class="text-center">
                                                         <span class="spinner-border text-primary mt-5" style="width:7rem;height:7rem"></span>
                                                     </div>`;
    var db = firebase.database().ref('users');
    var dbNoti = firebase.database().ref('notifications');
    var lst = '';
    db.on('value', function (users) {
        if (users.hasChildren()) {
            lst = `<li class="list-group-item" style="background-color:#f8f8f8;">
                            <input type="text" placeholder="Search or new chat" class="form-control form-rounded" />
                        </li>`;
            document.getElementById('lstUsers').innerHTML = lst;
        }
        users.forEach(function (data) {
            var user = data.val();
            if (user.email !== firebase.auth().currentUser.email) {
                dbNoti.orderByChild('sendTo').equalTo(data.key).on('value', function (noti) {
                    if (noti.numChildren() > 0 && Object.values(noti.val())[0].sendFrom === currentUserKey) {
                        lst = `<li class="list-group-item list-group-item-action">
                            <div class="row">
                                <div class="col-md-2">
                                    <img src="${user.photoURL}" class="rounded-circle friend-pic" />
                                  </div>
                                <div class="col-md-10" style="cursor:pointer;">
                                    <div class="name">${user.name}
                                        <button class="btn btn-sm btn-default" style="float:right;"><i class="fas fa-user-plus"></i> Sent</button>
                                    </div>
                                </div>
                            </div>
                        </li>`;
                        document.getElementById('lstUsers').innerHTML += lst;
                    }
                    else {
                        dbNoti.orderByChild('sendFrom').equalTo(data.key).on('value', function (noti) {
                            if (noti.numChildren() > 0 && Object.values(noti.val())[0].sendTo === currentUserKey) {
                                lst = `<li class="list-group-item list-group-item-action">
                            <div class="row">
                                <div class="col-md-2">
                                    <img src="${user.photoURL}" class="rounded-circle friend-pic" />
                                </div>
                                <div class="col-md-10" style="cursor:pointer;">
                                    <div class="name">${user.name}
                                        <button class="btn btn-sm btn-defualt" style="float:right;"><i class="fas fa-user-plus"></i> Pending</button>
                                    </div>
                                </div>
                            </div>
                        </li>`;
                                document.getElementById('lstUsers').innerHTML += lst;
                            }
                            else {
                                lst = `<li class="list-group-item list-group-item-action" data-dismiss="modal">
                            <div class="row">
                                <div class="col-md-2">
                                    <img src="${user.photoURL}" class="rounded-circle friend-pic" />
                                </div>
                                <div class="col-md-10" style="cursor:pointer;">
                                    <div class="name">${user.name}
                                        <button onclick="SendRequest('${data.key}')" class="btn btn-sm btn-primary" style="float:right;"><i class="fas fa-user-plus"></i> Send Request</button>
                                    </div>
                                </div>
                            </div>
                        </li>`;

                                document.getElementById('lstUsers').innerHTML += lst;
                            }
                        });
                    }
                });
            }
        });
    });

}
////////////////// Notification counter ////////////////////
function NotificationCount() {
    let db = firebase.database().ref('notifications');

    db.orderByChild('sendTo').equalTo(currentUserKey).on('value', function (noti) {
        let notiArray = Object.values(noti.val()).filter(n => n.status === 'Pending');
        document.getElementById('notification').innerHTML = notiArray.length;
    });
}
//////////////////////// Send Requests ///////////////////////
function SendRequest(key) {
    let notification = {
        sendTo: key,
        sendFrom: currentUserKey,
        name: firebase.auth().currentUser.displayName,
        photo: firebase.auth().currentUser.photoURL,
        dateTime: new Date().toLocaleString(),
        status: 'Pending'
    };

    firebase.database().ref('notifications').push(notification, function (error) {
        if (error) alert(error);
        else {
            // do something
            PopulateUserList();
        }
    });
}

function PopulateNotifications() {
    document.getElementById('lstNotification').innerHTML = `<div class="text-center">
                                                         <span class="spinner-border text-primary mt-5" style="width:7rem;height:7rem"></span>
                                                     </div>`;
    var db = firebase.database().ref('notifications');
    var lst = '';
    db.orderByChild('sendTo').equalTo(currentUserKey).on('value', function (notis) {
        if (notis.hasChildren()) {
            lst = `<li class="list-group-item" style="background-color:#f8f8f8;">
                            <input type="text" placeholder="Search or new chat" class="form-control form-rounded" />
                        </li>`;
        }
        notis.forEach(function (data) {
            var noti = data.val();
            if (noti.status === 'Pending') {
                lst += `<li class="list-group-item list-group-item-action">
                            <div class="row">
                                <div class="col-md-2">
                                    <img src="${noti.photo}" class="rounded-circle friend-pic" />
                                </div>
                                <div class="col-md-10" style="cursor:pointer;">
                                    <div class="name">${noti.name}
                                        <button onclick="Reject('${data.key}')" class="btn btn-sm btn-danger" style="float:right;margin-left:1%;"><i class="fas fa-user-times"></i> Reject</button>
                                        <button onclick="Accept('${data.key}')" class="btn btn-sm btn-success" style="float:right;"><i class="fas fa-user-check"></i> Accept</button>
                                    </div>
                                </div>
                            </div>
                        </li>`;
            }
        });

        document.getElementById('lstNotification').innerHTML = lst;
    });
}

function Reject(key) {
    let db = firebase.database().ref('notifications').child(key).once('value', function (noti) {
        let obj = noti.val();
        obj.status = 'Reject';
        firebase.database().ref('notifications').child(key).update(obj, function (error) {
            if (error) alert(error);
            else {
                // do something
                PopulateNotifications();
            }
        });
    });
}

function Accept(key) {
    let db = firebase.database().ref('notifications').child(key).once('value', function (noti) {
        var obj = noti.val();
        obj.status = 'Accept';
        firebase.database().ref('notifications').child(key).update(obj, function (error) {
            if (error) alert(error);
            else {
                // do something
                PopulateNotifications();
                var friendList = { friendId: obj.sendFrom, userId: obj.sendTo };
                firebase.database().ref('friend_list').push(friendList, function (error) {
                    if (error) alert(error);
                    else {
                        //do Something
                    }
                });
            }
        });
    });
}

// make all user list send request function
function populateFriendList() {
    document.getElementById("lstfriend").innerHTML = `<div class="text-center mt-10">
                                                        <span class="spinner-border txt-primary" style = "width : 7rem; height:7rem " role="status"></span>
                                                    </div>`
    var db = firebase.database().ref("users")
    var list = ""
    db.on("value", function (users) {
        if (users.hasChildren()) {
            list = `<li class="list-group-item" style="background-color:#f8f8f8">
                        <input type="text" placeholder="Seach Here" class="form-control form-rounded">
                    </li>`
        }
        users.forEach(function (data) {
            var user = data.val()
            if (user.email !== firebase.auth().currentUser.email) {
                list += `<li data-dismiss="modal" class="list-group-item list-group-item-action" onclick="startChat('${data.key}','${user.name}','${user.photoURL}')">
                <div class="row">
                    <div class="col-md-2">
                        <img src="${user.photoURL}" class ="FriendPic rounded-circle">
                    </div>
                    <div class="col-md-10">
                        <div class="name">${user.name}</div>
                    </div>
                </div>
            </li>`
            }
        })
        document.getElementById("lstfriend").innerHTML = list
    })
}

//////////////////////// Sign in ///////////////////////

function signIn() {
    var provider = new firebase.auth.GoogleAuthProvider();
    firebase.auth().signInWithPopup(provider)
    firebase.auth().signInWithPopup(provider).then(function(result) {
        // This gives you a Google Access Token. You can use it to access the Google API.
        var token = result.credential.accessToken;
        // The signed-in user info.
        var user = result.user;
        // ...
      }).catch(function(error) {
        // Handle Errors here.
        var errorCode = error.code;
        var errorMessage = error.message;
        // The email of the user's account used.
        var email = error.email;
        // The firebase.auth.AuthCredential type that was used.
        var credential = error.credential;
        // ...
      });
}

//////////////////////// Sign out ///////////////////////

function signOut() {
    firebase.auth().signOut()
}
function onFirebaseStateChange() {
    firebase.auth().onAuthStateChanged(onStateChange)
}
function onStateChange(user) {
    if (user) {
        var userProfile = {
            email: firebase.auth().currentUser.email,
            name: firebase.auth().currentUser.displayName,
            photoURL: firebase.auth().currentUser.photoURL,
        }

        var db = firebase.database().ref("users")
        var flag = false
        db.on("value", function (user) {
            user.forEach(function (data) {
                var user = data.val()
                if (user.email === userProfile.email) {
                    currentUserKey = data.key
                    flag = true
                }
            })
            if (flag === false) {
                firebase.database().ref("users").push(userProfile, callback)
            } else {
                document.getElementById("imgProfile").src = firebase.auth().currentUser.photoURL
                document.getElementById("imgProfile").title = firebase.auth().currentUser.displayName
                document.getElementById("linkSignIn").style = "display:none"
                document.getElementById("linkSignOut").style = ""
            }

            const messaging = firebase.messaging();
            navigator.serviceWorker.register('./firebase-messaging-sw.js')
                .then((registration) => {
                    messaging.useServiceWorker(registration);

                    // Request permission and get token.....
                    messaging.requestPermission().then(function () {
                        return messaging.getToken();
                    }).then(function (token) {
                        firebase.database().ref('fcmTokens').child(currentUserKey).set({ token_id: token });
                    })
                });

            document.getElementById("linkChat").classList.remove("disabled")
            loadChatList()
            NotificationCount()
        })


    } else {
        document.getElementById("imgProfile").src = "Images/pp.jpg"
        document.getElementById("imgProfile").title = ""
        document.getElementById("linkSignIn").style = ""
        document.getElementById("linkSignOut").style = "display:none"
        document.getElementById("lstChat").innerHTML = ""

        document.getElementById("linkChat").classList.add("disabled")

    }
}


function callback(error) {
    if (error) {
        alert("wrong" + error)
    } else
        document.getElementById("imgProfile").src = firebase.auth().currentUser.photoURL
    document.getElementById("imgProfile").title = firebase.auth().currentUser.displayName
    document.getElementById("linkSignIn").style = "display:none"
    document.getElementById("linkSignOut").style = ""
}
// ////
onFirebaseStateChange()

////////////////////////////////////////
// render emoji function 
loadEmojies()
function loadEmojies() {
    var emoji = ""
    for (i = 128512; i <= 128567; i++) {
        emoji += `<a href="#" style="font-size:22px" onclick="getEmojie(this)">&#${i};</a>`
    }
    for (i = 128577; i <= 128580; i++) {
        emoji += `<a href="#" style="font-size:22px" onclick="getEmojie(this)">&#${i};</a>`
    }
    for (i = 129296; i <= 129301; i++) {
        emoji += `<a href="#" style="font-size:22px" onclick="getEmojie(this)">&#${i};</a>`
    }
    for (i = 129312; i <= 129327; i++) {
        emoji += `<a href="#" style="font-size:22px" onclick="getEmojie(this)">&#${i};</a>`
    }
    for (i = 129488; i <= 129488; i++) {
        emoji += `<a href="#" style="font-size:22px" onclick="getEmojie(this)">&#${i};</a>`
    }
    document.getElementById("Smiley").innerHTML = emoji
}
function showEmojiPanal() {
    document.getElementById("emoji").classList.remove("d-none")
}
function hideEmojiPanel() {
    document.getElementById("emoji").classList.add("d-none")
}
function getEmojie(controle) {
    document.getElementById("txtMessage").value += controle.innerHTML
}
////////////////////////////////////////



