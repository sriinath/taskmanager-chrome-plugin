const ENDPOINT='https://tasks-data-tracker.herokuapp.com/'

chrome.runtime.onMessage.addListener(async function (message, sender, sendResponse) {
    console.log('message received', message)
    if(message && message.type && message.type === 'API' && message.name) {
        switch(message.name) {
            case "GET_ALL_TASKS": {
                sendResponse(await getAllTasks(message.token || ''))
                break
            }
            case 'CREATE_TASK': {
                sendResponse(await create_task(message.token || '', message.data || {}))
                break;
            }
            case 'UPDATE_TASK': {
                sendResponse(await update_task(message.token || '', message.id, message.data || {}))
                break;
            }
            default:
                console.log('Not a valid API')
        }
    }
    return true
})

const getAllTasks = (token) => {
    console.log('getting all tasks')
    return fetch(
      `${ENDPOINT}api/tasks`,
      {
        method: 'GET',
        headers: {
          'Authorization': token
        }
      }
    )
    .then(resp => resp.json())
    .then(data => {
        if(data && data.title && data.title === "401 Unauthorized") {
            return {
                'refresh_token': true
            }
        }
        else if(data && data.status && data.status.toLowerCase() === 'success') {
            return data
        } else {
            return []
        }
    })
    .catch(err => {
        console.log(err)
        return []
    })
}

const create_task = (token, taskObj) => {
    console.log('creating tasks with obj', taskObj)
    if(taskObj && taskObj.title) {
        return fetch(
            `${ENDPOINT}api/tasks`,
            {
              method: 'POST',
              headers: {
                'Authorization': token,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify(taskObj)
            }
        )
        .then(resp => resp.json())
        .then(data => {
            if(data && data.title && data.title === "401 Unauthorized") {
                return {
                    'refresh_token': true
                }
            }
            else if(data && data.status && data.status.toLowerCase() === 'success') {
                return 'Success'
            } else {
                return 'Failure'
            }
        })
        .catch(err => {
            console.log(err)
            return 'Failure'
        })    
    } else {
        return 'Title is mandatory to create a task'
    }
}

const update_task = (token, taskId, taskObj) => {
    console.log(`updating tasks with obj ${taskObj} for task ${taskId}`)
    if(taskObj && taskObj.title) {
        return fetch(
            `${ENDPOINT}api/tasks/${taskId}`,
            {
              method: 'PUT',
              headers: {
                'Authorization': token,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify(taskObj)
            }
        )
        .then(resp => resp.json())
        .then(data => {
            if(data && data.title && data.title === "401 Unauthorized") {
                return {
                    'refresh_token': true
                }
            }
            else if(data && data.status && data.status.toLowerCase() === 'success') {
                return 'Success'
            } else {
                return 'Failure'
            }
        })
        .catch(err => {
            console.log(err)
            return 'Failure'
        })    
    } else {
        return 'Title is mandatory to update a task'
    }
}