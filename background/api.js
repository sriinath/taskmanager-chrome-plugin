const ENDPOINT='https://tasks-data-tracker.herokuapp.com/'
let NOTIFIER_API_KEY=''
chrome.storage.local.get(['NOTIFIER_API_KEY'], function(result) {
    if(result && result['NOTIFIER_API_KEY']) {
        NOTIFIER_API_KEY=result['NOTIFIER_API_KEY']
    }
});
chrome.runtime.onMessage.addListener(async function (message, sender, sendResponse) {
    console.log('message received', message)
    if(message && message.type && message.type === 'API' && message.name) {
        switch(message.name) {
            case "GET_ALL_TASKS": {
                sendResponse(await getAllTasks(message.token || '', message.filters || {}))
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
            case 'DELETE_TASK': {
                sendResponse(await delete_task(message.token || '', message.id))
            }
            default:
                console.log('Not a valid API')
        }
    }
    return true
})

const getAllTasks = (token, filters) => {
    console.log('getting all tasks')
    const {
        limit,
        offset,
        start_date,
        end_date
    } = filters
    return fetch(
      `${ENDPOINT}api/tasks?limit=${limit || 10}&offset=${offset || 0}&start_date=${start_date || ''}&end_date=${end_date || ''}`,
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

const delete_task = (token, taskId) => {
    console.log(`deleting tasks with id ${taskId}`)
    return fetch(
        `${ENDPOINT}api/tasks/${taskId}`,
        {
            method: 'DELETE',
            headers: {
            'Authorization': token,
            'Content-Type': 'application/json'
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
            return 'Success'
        } else {
            return 'Failure'
        }
    })
    .catch(err => {
        console.log(err)
        return 'Failure'
    })    
}