const socket = io()

const form = document.querySelector('#message-form')
const formInput = form.querySelector('input')
const formButton = form.querySelector('button')
const locationButton = document.getElementById('send_location')
const messages = document.getElementById('messages')

const messageTemplate = document.getElementById('message-template').innerHTML
const locationMessageTemplate = document.getElementById('location-message-template').innerHTML
const sidebarTemplate = document.getElementById('sidebar-template').innerHTML

const {username, room} = Qs.parse(location.search, { ignoreQueryPrefix: true })

const autoScroll = () => {
    const newMessage = messages.lastElementChild
    const newMessageStyles = getComputedStyle(newMessage)
    const newMessageMargin = parseInt(newMessageStyles.marginBottom)
    const newMessageHeight = newMessage.offsetHeight + newMessageMargin
    const visibleHeight = messages.offsetHeight
    const containerHeight = messages.scrollHeight
    const scrollOffset = messages.scrollTop + visibleHeight

    if (containerHeight - newMessageHeight <= scrollOffset) {
        messages.scrollTop = messages.scrollHeight
    }
}

socket.on('message', (message) => {
    console.log(message)
    const html = Mustache.render(messageTemplate, {
        username: message.username,
        message: message.text,
        createdAt: moment(message.createdAt).format('h:mm a') 
    })
    messages.insertAdjacentHTML('beforeend', html)
    autoScroll()
})

socket.on('locationMessage', (message) => {
    console.log(message)
    const html = Mustache.render(locationMessageTemplate, {
        username: message.username,
        url: message.url,
        createdAt: moment(message.createdAt).format('h:mm a')
    })
    messages.insertAdjacentHTML('beforeend', html)
    autoScroll()
})

socket.on('roomData', ({room, users}) => {
    const html = Mustache.render(sidebarTemplate, {
        users,
        room
    })
    document.getElementById('sidebar').innerHTML = html
})

form.addEventListener('submit', (e) => {
    e.preventDefault()
    formButton.disabled = true
    const message = e.target.elements.message.value

    if (message != '') {
        socket.emit('sendMessage', message, (error) => {

            formButton.disabled = false
            formInput.value = ''
            formInput.focus()
    
            if (error) {
                return console.log(error)
            }
    
            console.log('Sent :)')
        })
    }
})

locationButton.addEventListener('click', (e) => {
    e.preventDefault()

    locationButton.disabled = true
    formInput.focus()

    if (!navigator.geolocation) {
        return alert('Geolocation not supported by your browser')
    }

    navigator.geolocation.getCurrentPosition((position) => {

        locationButton.disabled = false

        socket.emit('sendLocation', {
            lat: position.coords.latitude, 
            long: position.coords.longitude
        }, () => {
            console.log('Location Shared')
        })
    })
})

socket.emit('join', {username, room}, (error) => {
    if (error) {
        alert(error)
        location.href = '/'
    }
})