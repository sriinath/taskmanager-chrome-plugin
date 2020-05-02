let LIMIT=10
let OFFSET=0
let startDateFilter=''
let endDateFilter=''
$(document).ready(function() {
  console.log('sending message to authenticate')
  toggleMask('Authenticating the User...')
  chrome.runtime.sendMessage({
    'type': 'authenticate'
  },
  async response => {
    toggleMask()
    if(chrome.runtime.lastError) {
      console.log("error: ", chrome.runtime.lastError);
    } else{
      if(response && response.status && response.status.toLowerCase() === 'success') {
        $('.task_wrapper').show()
        updateUserName(response.data && response.data.username || '')
        setCurrentDate()
        getTasks(response.data.token)
      }        
    }
  })
  bindEvents()
})

// common functions starts
const updateUserName = username => document.getElementById('username').innerText = username || ''
const setCurrentDate = () => document.getElementById('task_date').value=new Date().toISOString().substring(0, 10)

const renderBulletIcon = (is_selected, bulletClickCbk) => {
  const bulletEl= document.createElement('div')
  bulletEl.classList.add('bullet_el')
  const bulletIcon=document.createElement('i')
  bulletIcon.classList.add('fas', 'font-avg-icon', 'fa-check')
  bulletEl.append(bulletIcon)
  if(is_selected) {
    bulletIcon.style.display='block'
    bulletEl.style.background='#fff'
  }
  bulletEl.addEventListener('click', function() {
    bulletIcon.style.display=is_selected ? 'none' : 'block'
    bulletEl.style.background=is_selected ? 'transparent' : '#fff'
    bulletClickCbk(!is_selected)
  })
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
        toggleMask('Creating the task...')
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
          toggleMask()
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
                  showMessage('Successfully created task', '#3b9a6f')
                  getTasks(token)
                } else {
                  showMessage('Failure in creating task', '#e75b65')
                }
              }
            }
          }
        })
      })
    } else {
      showMessage('Title and date is mandatory', '#e75b65')
    }
  })
}

const showMessage = (message, color) => {
  const msgEl=document.getElementById('message')
  msgEl.innerText=message
  msgEl.style.display='block'
  msgEl.style.color=color || '#000'
  setTimeout(() => {
    msgEl.style.display='none'  
  }, 5000)
}

const toggleMask = message => {
  if(message) {
    if(!$('body').hasClass('show_mask')) {
      $('body').addClass('show_mask')
      document.getElementById('mask_info').innerText=message
    }
  } else {
    $('body').removeClass('show_mask')
    document.getElementById('mask_info').innerText=''
  }
}
// common function ends

// DOM render function starts
const renderAllTasks = (tasks) => {
  const myTasksEl=document.getElementById('mytasks')
  if(!OFFSET) {
    myTasksEl.innerHTML=''
  }
  if(tasks && Array.isArray(tasks) && tasks.length) {
    if(!OFFSET) {
      myTasksEl.append(renderFilter())
    }
    tasks.map(task => myTasksEl.append(renderTask(task)))
    myTasksEl.append(showMore())
  } else {
    if(!OFFSET) {
      myTasksEl.innerHTML='<center>No Tasks</center>'
    }
  }
}

const renderFilter = () => {
  const filterWrapper=document.createElement('div')
  filterWrapper.classList.add('filter_wrapper')
  const startDateWr=document.createElement('div')
  const startDateLab=document.createElement('label')
  startDateLab.htmlFor='start_date_filter'
  startDateLab.innerText='Start Date'
  const startDateEl=document.createElement('input')
  startDateEl.classList.add('start_filter', 'input_cont')
  startDateEl.id='start_date_filter'
  startDateEl.type='date'
  startDateEl.value=startDateFilter
  startDateWr.append(
    startDateLab,
    startDateEl
  )
  const endDateWr=document.createElement('div')
  const endDateLab=document.createElement('label')
  endDateLab.htmlFor='end_date_filter'
  endDateLab.innerText='End Date'
  const endDateEl=document.createElement('input')
  endDateEl.classList.add('end_filter', 'input_cont')
  endDateEl.id='end_date_filter'
  endDateEl.type='date'
  endDateEl.value=endDateFilter
  startDateEl.addEventListener('change', e => {
    startDateFilter=e.currentTarget.value
    chrome.storage.local.get(['access_token'], function(result) {
      showMessage('Start date filter is initiated')
      OFFSET=0
      let token = result.access_token || ''
      getTasks(token)
    })
  })
  endDateEl.addEventListener('change', e => {
    endDateFilter=e.currentTarget.value
    chrome.storage.local.get(['access_token'], function(result) {
      showMessage('End date filter is initiated')
      OFFSET=0
      let token = result.access_token || ''
      getTasks(token)
    })
  })
  endDateWr.append(
    endDateLab,
    endDateEl
  )
  filterWrapper.append(
    startDateWr,
    endDateWr
  )
  filterEvents()
  return filterWrapper
}

const showMore = () => {
  const showMoreEl=document.createElement('div')
  showMoreEl.classList.add('show_more')
  showMoreEl.innerText='LOAD MORE'
  showMoreEl.addEventListener('click', () => {
    OFFSET+=1
    chrome.storage.local.get(['access_token'], function(result) {
      showMessage('Load more is initiated')
      let token = result.access_token || ''
      getTasks(token)
      showMoreEl.remove()
    })
  })
  return showMoreEl
}

const filterEvents = () => {
  $('#start_date_filter').off('change').on('change', () => {
    value=$(this).value
    alert(value)
  })
  $('#end_date_filter').off('change').on('change', () => {
    value=$(this).value
    alert(value)
  })
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
      if(data && !Object.keys(data).length) {
        sub.splice(index, 1)
      } else {
        sub[index]=data
      }
    } else if(data && Object.keys(data).length) {
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
  moreInfoEl.innerText='Show Details' 
  const editTaskEl=document.createElement('i')
  editTaskEl.classList.add("font-avg-icon", "fas", "fa-pencil-alt")
  editTaskEl.title='Edit Details'
  const delTaskEl=document.createElement('i')
  delTaskEl.classList.add('font-avg-icon', 'fas', 'fa-trash')
  delTaskEl.title='Delete Task'
  const bulletIcon=renderBulletIcon(is_completed.toLowerCase() === 'true' ? true : false, (is_selected) => {
    updateSubTask(id, {
      title,
      description,
      date,
      total_time,
      is_completed: is_selected,
      sub_tasks: JSON.stringify(sub)
    })
  })
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
    bulletIcon,
    taskMainEl,
    editTaskEl,
    delTaskEl
  )
  const sub_tasks=SUB_TASKS ? JSON.parse(SUB_TASKS) : []
  const taskSubWrapper=document.createElement('div')
  taskSubWrapper.classList.add('tasks_sub_wrapper')
  moreInfoEl.addEventListener('click', function() {
    if(taskSubWrapper.classList.contains('show')) {
      taskSubWrapper.classList.remove('show')
      moreInfoEl.innerText='Show Details'
    } else {
      taskSubWrapper.classList.add('show')
      moreInfoEl.innerText='Hide Details'
    }
  })
  editTaskEl.addEventListener('click', function() {
    taskMainEl.style.display='none'
    bulletIcon.style.display='none'
    editTaskEl.style.display='none'
    delTaskEl.style.display='none'
    taskSubWrapper.classList.remove('show')
    moreInfoEl.innerText='Show Details'
    taskParentEl.prepend(edit_task(taskData, task => {
      const tempTask=JSON.parse(JSON.stringify(task))
      tempTask.sub_tasks=SUB_TASKS
      updateSubTask(id, tempTask)
    }, () => {
      taskMainEl.style.display='block'
      bulletIcon.style.display='block'
      editTaskEl.style.display='block'   
      delTaskEl.style.display='block' 
    }))
  })
  delTaskEl.addEventListener('click', function() {
    chrome.storage.local.get(['access_token'], function(result) {
      showMessage('Delete task is initiated')
      let token = result.access_token || ''
      toggleMask('Deleting the task...')
      chrome.runtime.sendMessage({
        'type': 'API',
        'name': 'DELETE_TASK',
        'token': token,
        id
      }, data => {
        toggleMask()
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
              showMessage('Successfully Deleted task', '#3b9a6f')
              getTasks(token)
            } else {
              showMessage('Failure in deleting task', '#e75b65')
            }
          }
        }
      })
    })
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
      const editBtn=document.createElement('i')
      editBtn.classList.add("font-avg-icon", "fas", "fa-pencil-alt")
      editBtn.title='Edit Details'
      const delBtn=document.createElement('i')
      delBtn.classList.add('font-avg-icon', 'fas', 'fa-trash')
      delBtn.title='Delete Sub Task'
      editBtn.addEventListener('click', () => {
        const subTaskEditWrapper=createSubTask(task, updateTask, index, () => {
          subTaskIconWrapper.style.display='flex'
          subTaskEditWrapper.remove()
        })
        subTaskIconWrapper.style.display='none'
        subTaskWrapper.insertBefore(subTaskEditWrapper, subTaskIconWrapper)
      })
      delBtn.addEventListener('click', () => {
        updateTask({}, index)
      })
      subTaskIconWrapper.append(
        renderBulletIcon(task.is_completed, (is_selected) => {
          updateTask({
            title: task.title,
            total_time: task.total_time,
            is_completed: is_selected
          }, index)
        }),
        subTaskCont,
        editBtn,
        delBtn
      )
      subTaskWrapper.append(subTaskIconWrapper)
    })
  }
  return subTaskWrapper
}

const createSubTask = (subTask, updateTask, index, cancelCbk) => {
  const {
    title,
    total_time,
    is_completed
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
  subTaskHoursEl.type='number'
  subTaskHoursEl.max=23
  const subTaskMinEl=document.createElement('input')
  subTaskMinEl.classList.add('subtask_min_inp', 'input_cont')
  subTaskMinEl.id='subtask_min'
  subTaskMinEl.value=min || ''
  subTaskMinEl.placeholder='Minutes'
  subTaskMinEl.max=60
  subTaskMinEl.type='number'
  const subTaskAddEl=document.createElement('i')
  subTaskAddEl.classList.add('fas', 'font-big-icon', title ? 'fa-check' : 'fa-plus', 'subtask_add_el')
  subTaskAddEl.style.color='#3b9a6f'
  subTaskAddEl.title=title ? 'Update details' : 'Add Sub task'
  const subTaskCancelEl=document.createElement('div')
  subTaskCancelEl.classList.add('fas', 'font-big-icon', 'fa-times', 'subtask_cancel_el')
  subTaskCancelEl.style.color='#e75b65'
  subTaskCancelEl.title='Cancel Update'
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
    if(subTaskTitleEl.value) {
      updateTask({
        title: subTaskTitleEl.value,
        total_time: (subTaskHoursEl.value ? subTaskHoursEl.value + 'h ' : '') + (subTaskMinEl.value ? subTaskMinEl.value + 'm' : ''),
        is_completed
      }, index)  
    } else {
      showMessage('Title is required to create sub task', '#e75b65')
    } 
  })
  subTaskCancelEl.addEventListener('click', cancelCbk)
  return subtask_create_wrapper
}

const edit_task = (task, updateTask, cancelCbk) => {
  const total_time=task.TOTAL_TIME || ''
  const hourSplitter=total_time ? total_time.split('h ') : []
  const hour=hourSplitter[0] ? hourSplitter[0] : ''
  const min=hourSplitter[1] ? hourSplitter[1].split('m') : ''
  const taskUpdateWrapper=document.createElement('div')
  taskUpdateWrapper.classList.add('task_update')
  const titleInp=document.createElement('input')
  titleInp.classList.add('input_cont')
  titleInp.id='task_title'
  titleInp.placeholder='title'
  titleInp.value=task.TITLE || ""
  titleInp.maxLength=50
  const descInp=document.createElement('textarea')
  descInp.classList.add('textarea_cont')
  descInp.placeholder='Description'
  descInp.value=task.DESCRIPTION || ""
  descInp.rows=3
  const dateInp=document.createElement('input')
  dateInp.classList.add('input_cont')
  dateInp.value=task.DATE || ""
  dateInp.type='date'
  dateInp.id='task_date'
  const hourInp=document.createElement('input')
  hourInp.classList.add('time_hours', 'input_cont')
  hourInp.value=hour || ""
  hourInp.type='number'
  hourInp.max=23
  hourInp.placeholder='hours'
  const minInp=document.createElement('input')
  minInp.classList.add('time_minutes', 'input_cont')
  minInp.value=min || ""
  minInp.type='number'
  minInp.max=60
  minInp.placeholder='minutes'
  const time_wrapper_el=document.createElement('div')
  time_wrapper_el.classList.add('task_time')
  time_wrapper_el.append(
    hourInp,
    minInp
  )
  taskUpdateWrapper.append(
    titleInp,
    dateInp,
    descInp,
    time_wrapper_el
  )
  const updateWrapperEl=document.createElement('div')
  updateWrapperEl.classList.add('update_wrapper')
  const updateTaskEl=document.createElement('div')
  updateTaskEl.classList.add('update_task')
  updateTaskEl.title='Update Task'
  updateTaskEl.innerText='Update'
  const cancelTaskEl=document.createElement('div')
  cancelTaskEl.classList.add('cancel_update_task')
  cancelTaskEl.title='Cancel Update'
  cancelTaskEl.innerText='Cancel'
  const updateTaskIcon=document.createElement('i')
  updateTaskIcon.classList.add('fas', 'fa-check', 'font-big-icon')
  const cancelTaskIcon=document.createElement('i')
  cancelTaskIcon.classList.add('fas', 'fa-times', 'font-big-icon')
  updateTaskEl.append(updateTaskIcon)
  cancelTaskEl.append(cancelTaskIcon)
  cancelTaskEl.addEventListener('click', () => {
    taskUpdateWrapper.remove()
    cancelCbk()
  })
  updateTaskEl.addEventListener('click', function() {
    updateTask({
      title: titleInp.value || '',
      description: descInp.value || '',
      date: dateInp.value || '',
      total_time: (hourInp.value ? ((hourInp.value || '') + 'h ') : '') + (minInp.value ? ((minInp.value || '') + 'm') : '')
    })
  })
  updateWrapperEl.append(
    updateTaskEl,
    cancelTaskEl
  )
  taskUpdateWrapper.append(updateWrapperEl)
  return taskUpdateWrapper
}
// DOM render function ends

// API related functions starts
const getTasks = token => {
  toggleMask('Getting the tasks...')
  chrome.runtime.sendMessage({
    'type': 'API',
    'name': 'GET_ALL_TASKS',
    'token': token || '',
    'filters': {
      offset: OFFSET,
      limit: LIMIT,
      start_date: startDateFilter,
      end_date: endDateFilter
    }
  }, taskList => {
    toggleMask()
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
      toggleMask('Updating the task...')
      chrome.runtime.sendMessage({
        'type': 'API',
        'name': 'UPDATE_TASK',
        'token': token,
        id: taskId,
        data
      }, data => {
        toggleMask()
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
              showMessage('Successfully Updated task', '#3b9a6f')
              getTasks(token)
            } else {
              showMessage('Failure in updating task', '#e75b65')
            }
          }
        }
      })
    })
  } else {
    showMessage('Title and date is mandatory', '#e75b65')
  }
}
// API related function ends