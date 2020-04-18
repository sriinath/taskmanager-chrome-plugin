$(document).ready(function() {
  console.log('sending message to authenticate')
  chrome.runtime.sendMessage({
    'type': 'authenticate'
  },
  async response => {
    if(chrome.runtime.lastError) {
      console.log("error: ", chrome.runtime.lastError);
    } else{
      if(response && response.status && response.status.toLowerCase() === 'success') {
        updateUserName(response.data && response.data.username || '')
        setCurrentDate()
        getTasks(response.data.token)
      }        
    }
  })
  bindEvents()
})

const updateUserName = username => document.getElementById('username').innerText = username || ''
const setCurrentDate = () => document.getElementById('task_date').value=new Date().toISOString().substring(0, 10)
const renderBulletIcon = () => {
  const bulletEl= document.createElement('div')
  bulletEl.classList.add('bullet_el')
  return bulletEl
}

const bindEvents = () => {
  $('.add_wrapper_details').off('click').on('click', function() {
    $('.task_sub_wrapper').toggle()
    const iconWrapper=$(this).find('.wrapper_icon_details')
    if(iconWrapper.hasClass('open')) {
      iconWrapper.removeClass('open')
    } else {
      iconWrapper.addClass('open')
    }
  })
  $(".my_tasks span").off('click').on('click', function() {
    if($(".mytasks_list").hasClass('show')) {
      $(this).text('Show')
      $(".mytasks_list").removeClass('show')
    } else {
      $(this).text('Hide')
      $(".mytasks_list").addClass('show')
    }
  })
  $(".completed_tasks span").off('click').on('click', function() {
    const taskWrapper=$('.completed_list')
    if(taskWrapper.hasClass('show')) {
      $(this).text('Show')
      taskWrapper.removeClass('show')
    } else {
      $(this).text('Hide')
      taskWrapper.addClass('show')
    }
  })
  $('.create_task').off('click').on('click', function() {
    const titleEl=$('#task_title')
    const descEl=$('#desc')
    const dateEl=$('#task_date')
    const hoursEl=$('#task_hours')
    const minEl=$('#task_min')
    const title=titleEl.val()
    const desc=descEl.val()
    const date=dateEl.val()
    const time=(hoursEl.val() ? hoursEl.val() + 'h ' : '') + (minEl.val() ? minEl.val() + 'm' : '')
    if(title && date) {
      showMessage('Create task is initiated')
      titleEl[0].value=''
      descEl[0].value=''
      dateEl[0].value=new Date().toISOString().substring(0, 10)
      hoursEl[0].value=''
      minEl[0].value=''
      chrome.storage.local.get(['access_token'], function(result) {
        let token = result.access_token || ''
        chrome.runtime.sendMessage({
          'type': 'API',
          'name': 'CREATE_TASK',
          'token': token || '',
          'data': {
            title,
            date,
            description: desc,
            total_time: time,
            sub_tasks: '[]'
          }
        }, data => {
          if(chrome.runtime.lastError) {
            console.log("error: ", chrome.runtime.lastError);
          } else{      
            if(data && data.refresh_token) {
              showMessage('Token expired. Refreshing...')
              chrome.runtime.sendMessage({
                'type': 'refreshToken'
              })
            } else if(data) {
              if(chrome.runtime.lastError) {
                console.log("error: ", chrome.runtime.lastError);
              } else{           
                if(data === 'Success') {
                  showMessage('Successfully created task')
                  getTasks(token)
                } else {
                  showMessage('Failure in creating task')
                }
              }
            }
          }
        })
      })
    } else {
      showMessage('Title and date is mandatory')
    }
  })
}

const showMessage = (message) => {
  const msgEl=document.getElementById('message')
  msgEl.innerText=message
  msgEl.style.display='block'
  setTimeout(() => {
    msgEl.style.display='none'  
  }, 5000)
}

const renderAllTasks = (tasks) => {
  document.getElementById('mytasks').innerHTML=''
  if(tasks && Array.isArray(tasks) && tasks.length) {
    tasks.map(task => document.getElementById('mytasks').append(renderTask(task)))
  } else {
    document.getElementById('mytasks').innerHTML='<center>No Tasks</center>'
  }
}

const renderTask = (taskData) => {
  const {
    row:id,
    TITLE:title,
    DATE:date,
    DESCRIPTION:description,
    TOTAL_TIME:total_time,
    SUB_TASKS,
    IS_COMPLETED:is_completed
  } = taskData

  const updateTask = (data, index) => {
    const tempData=JSON.parse(JSON.stringify(taskData))
    sub=JSON.parse(tempData.SUB_TASKS)
    if(typeof(index) === 'number' && sub && sub[index]) {
      sub[index]=data
    } else {
      sub.push(data)
    }
    updateSubTask(id, {
      title,
      description,
      date,
      total_time,
      sub_tasks: JSON.stringify(sub)
    })
  }

  const iconWrapper=document.createElement('div')
  iconWrapper.classList.add('taks_main_wrapper')
  const taskParentEl=document.createElement('div')
  taskParentEl.classList.add('task_parent_el')
  const taskMainEl=document.createElement('div')
  taskMainEl.classList.add('task_main_wrapper')
  const dateEl=document.createElement('div')
  dateEl.classList.add('task_date_cont')
  dateEl.innerText=date || ''
  const titleEl=document.createElement('div')
  titleEl.classList.add('task_title')
  titleEl.innerText=title || ''
  const timeEl=document.createElement('div')
  timeEl.classList.add('task_time')
  timeEl.innerHTML=total_time ? total_time + '<i>&nbsp;time logged.</i>': ''
  const taskLineWrapper=document.createElement('div')
  taskLineWrapper.classList.add('taks_line_wrapper')
  const descEl=document.createElement('div')
  descEl.classList.add('task_desc')
  descEl.innerText=description || ''
  const moreInfoEl=document.createElement('div')
  moreInfoEl.classList.add('show_sub_tasks')
  moreInfoEl.innerText='Show Info'  
  taskLineWrapper.append(
    dateEl,
    moreInfoEl
  )
  taskMainEl.append(
    titleEl,
    description ? descEl : '',
    total_time ? timeEl : '',
    taskLineWrapper
  )
  iconWrapper.append(
    renderBulletIcon(),
    taskMainEl
  )
  const sub_tasks=SUB_TASKS ? JSON.parse(SUB_TASKS) : []
  const taskSubWrapper=document.createElement('div')
  taskSubWrapper.classList.add('tasks_sub_wrapper')
  moreInfoEl.addEventListener('click', function() {
    if(taskSubWrapper.classList.contains('show')) {
      taskSubWrapper.classList.remove('show')
      moreInfoEl.innerText='Show Info'
    } else {
      taskSubWrapper.classList.add('show')
      moreInfoEl.innerText='Hide Info'
    }
  })
  taskSubWrapper.append(
    renderSubTask(sub_tasks, updateTask),
    createSubTask({}, updateTask)
  )
  taskParentEl.append(
    iconWrapper,
    taskSubWrapper
  )
  return taskParentEl
}

const renderSubTask = (sub_tasks, updateTask) => {
  const subTaskWrapper=document.createElement('div')
  subTaskWrapper.classList.add('tasks_subtasks_cont')
  if(sub_tasks && Array.isArray(sub_tasks)) {
    sub_tasks.map((task, index) => {
      const subTaskCont=document.createElement('div')
      subTaskCont.classList.add('subtask_cont')
      const subTaskTitle=document.createElement('div')
      subTaskTitle.classList.add('sub_tasks_title')
      subTaskTitle.innerText=task.title || ''
      const subTaskTime=document.createElement('div')
      subTaskTime.classList.add('sub_tasks_time')
      subTaskTime.innerText=task.total_time || ''
      subTaskCont.append(
        subTaskTitle,
        task.total_time ? subTaskTime : ''
      )
      const subTaskIconWrapper=document.createElement('div')
      subTaskIconWrapper.classList.add('subtask_icon_wrapper')
      const editBtn=document.createElement('div')
      editBtn.classList.add('subtask_edit_el')
      editBtn.innerText='Edit'
      editBtn.addEventListener('click', () => {
        const subTaskEditWrapper=createSubTask(task, updateTask, index, () => {
          subTaskIconWrapper.style.display='flex'
          subTaskEditWrapper.remove()
        })
        subTaskIconWrapper.style.display='none'
        subTaskWrapper.insertBefore(subTaskEditWrapper, subTaskIconWrapper)
      })
      subTaskIconWrapper.append(
        renderBulletIcon(),
        subTaskCont,
        editBtn
      )
      subTaskWrapper.append(subTaskIconWrapper)
    })
  }
  return subTaskWrapper
}

const createSubTask = (subTask, updateTask, index, cancelCbk) => {
  const {
    title,
    total_time
  } = subTask
  const hourSplitter=total_time ? total_time.split('h ') : []
  const hour=hourSplitter[0] ? hourSplitter[0] : ''
  const min=hourSplitter[1] ? hourSplitter[1].split('m') : ''
  const subtask_create_wrapper=document.createElement('div')
  subtask_create_wrapper.classList.add('subtask_create_wrapper')
  const subTaskTitleEl=document.createElement('input')
  subTaskTitleEl.classList.add('subtask_title_inp', 'input_cont')
  subTaskTitleEl.id='subtask_title'
  subTaskTitleEl.value=title || ''
  subTaskTitleEl.placeholder='Sub Task Title'
  const subTaskHoursEl=document.createElement('input')
  subTaskHoursEl.classList.add('subtask_hours_inp', 'input_cont')
  subTaskHoursEl.id='subtask_hours'
  subTaskHoursEl.value=hour || ''
  subTaskHoursEl.placeholder='Hours'
  const subTaskMinEl=document.createElement('input')
  subTaskMinEl.classList.add('subtask_min_inp', 'input_cont')
  subTaskMinEl.id='subtask_min'
  subTaskMinEl.value=min || ''
  subTaskMinEl.placeholder='Minutes'
  const subTaskAddEl=document.createElement('div')
  subTaskAddEl.classList.add('subtask_add_el')
  subTaskAddEl.innerText=title ? 'Update' : 'Add'
  const subTaskCancelEl=document.createElement('div')
  subTaskCancelEl.classList.add('subtask_cancel_el')
  subTaskCancelEl.innerText='Cancel'
  const subTaskTimeWrapper=document.createElement('div')
  subTaskTimeWrapper.classList.add('subtask_time_wrapper')
  subTaskTimeWrapper.append(
    subTaskHoursEl,
    subTaskMinEl,
    subTaskAddEl,
    title ? subTaskCancelEl : ''
  )
  subtask_create_wrapper.append(
    subTaskTitleEl,
    subTaskTimeWrapper
  )
  subTaskAddEl.addEventListener('click', () => {
    updateTask({
      title: subTaskTitleEl.value,
      total_time: (subTaskHoursEl.value ? subTaskHoursEl.value + 'h ' : '') + (subTaskMinEl.value ? subTaskMinEl.value + 'm' : '')
    }, index)
  })
  subTaskCancelEl.addEventListener('click', cancelCbk)
  return subtask_create_wrapper
}

const getTasks = token => {
  chrome.runtime.sendMessage({
    'type': 'API',
    'name': 'GET_ALL_TASKS',
    'token': token || ''
  }, taskList => {
    if(chrome.runtime.lastError) {
      console.log("error: ", chrome.runtime.lastError);
    } else{
      if(taskList && taskList.refresh_token) {
        showMessage('Token expired. Refreshing...')
        chrome.runtime.sendMessage({
          'type': 'refreshToken'
        })
      } else if(taskList && taskList.data && Array.isArray(taskList.data)) {
        renderAllTasks(taskList.data)
      }
      else {
        renderAllTasks([])
      }
    }
  })
}

const updateSubTask = (taskId, data) => {
  if(data.title && data.date) {
    chrome.storage.local.get(['access_token'], function(result) {
      showMessage('Updating task is initiated')
      let token = result.access_token || ''
      chrome.runtime.sendMessage({
        'type': 'API',
        'name': 'UPDATE_TASK',
        'token': token,
        id: taskId,
        data
      }, data => {
        if(chrome.runtime.lastError) {
          console.log("error: ", chrome.runtime.lastError);
        } else{    
          if(data && data.refresh_token) {
            showMessage('Token expired. Refreshing...')
            chrome.runtime.sendMessage({
              'type': 'refreshToken'
            })
          } else if(data) {
            if(data === 'Success') {
              showMessage('Successfully Updated task')
              getTasks(token)
            } else {
              showMessage('Failure in updating task')
            }
          }
        }
      })
    })
  } else {
    showMessage('Title and date is mandatory')
  }
}