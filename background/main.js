var firebaseConfig = {};
chrome.storage.local.get(['firebase_config'], function(result) {
    if(result && result['firebase_config']) {
        firebaseConfig=JSON.parse(result['firebase_config'])
    }
});

chrome.runtime.onInstalled.addListener(function() {
    alert('Plugin Initialized')
    // Initialize Firebase
    if(typeof firebase !== 'undefined' && !firebase.apps.length) {
        console.log('initializing firebase')
        firebase.initializeApp(firebaseConfig);
    } else {
        alert('Error in initialising firebase')
    }
});

chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
    console.log('message received', message)
    if(message && message.type) {
        switch(message.type) {
            case 'authenticate': {
                authenticateUser(data => sendResponse(data))
                break;
            }
            case 'refreshToken': {
                refreshIDToken(data => sendResponse(data))
                break;
            }
            case 'API':
                break;
            default: {
                sendResponse({
                    status: 'Failure',
                    data: null
                })
            }
        }
    }
    return true
})

const refreshIDToken = cbk => {
    firebase.auth().currentUser.getIdToken(/* forceRefresh */ true).then(function(idToken) {
        chrome.storage.local.set({access_token: idToken}, function() {
            console.log('access token is set as ' + idToken);
            cbk({
                status: 'Success',
                data: {
                    token: idToken
                }
            })    
        });
    }).catch(function(error) {
        console.log(error)
        cbk({
            status: 'Failure',
            data: null
        })
        // Handle error
    });
}

const authenticateUser = cbk => {
    console.log('authenticating user')
    try {
        var provider = new firebase.auth.GoogleAuthProvider();
        provider.addScope('https://www.googleapis.com/auth/userinfo.profile');
        firebase.auth().onIdTokenChanged((data) => {
            chrome.storage.local.get(['access_token'], function(result) {
                let token = result.access_token || ''
                if (data && token) {
                    console.log('sending existing user info', data)
                    cbk({
                        'status': 'Success',
                        'data': {
                            username: data.displayName,
                            email: data.email,
                            token
                        }
                    })
                } else {
                    console.log('showing popup to get user info')
                    firebase.auth().signInWithPopup(provider).then(function(result) {
                        token = result.credential && result.credential.idToken || ''
                        chrome.storage.local.set({access_token: token}, function() {
                            console.log('access token is set as ' + token);
                        });
                        console.log('sending retreived user info', result)
                        cbk({
                            'status': 'Success',
                            'data': {
                                username: result.user.displayName,
                                email: result.user.email,
                                token
                            }
                        })
                    }).catch(function(error) {
                        console.log('error in getting user info', error)
                        cbk({
                            status: 'Failure',
                            data: null
                        })
                    });      
                }    
            });
        });
    } catch(err) {
        console.log(err)
        alert('reinitializing firebase')
        if(typeof firebase !== 'undefined' && !firebase.apps.length) {
            console.log('initializing firebase')
            firebase.initializeApp(firebaseConfig);
            authenticateUser(cbk)
        } else {
            alert('Error in initialising firebase or firebase already initialized')
        }
    }
}
