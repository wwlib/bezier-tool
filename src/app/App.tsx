import * as React from 'react';
import * as ReactDOM from 'react-dom';
import Application from './components/Application';
import Model from './model/Model';
import BezierTool from './model/BezierTool';

declare let module: any

import './css/app.css';

let model: Model = new Model();

// model.on('ready', () => {
    ReactDOM.render(
        <Application model={model} />,
        document.getElementById('root')
    );
// });

const bezierTool = new BezierTool();

if (module.hot) {
    module.hot.accept();
}
