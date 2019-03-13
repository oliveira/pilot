import React from 'react'
import ReactDOM from 'react-dom'
import 'normalize.css'

import './initializeI18n'
import App from './App'
import registerServiceWorker from './registerServiceWorker'

// eslint-disable-next-line no-undef
ReactDOM.render(<App />, document.getElementById('root'))
registerServiceWorker()
