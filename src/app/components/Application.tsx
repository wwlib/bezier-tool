import * as React from "react";
import * as ReactBootstrap from "react-bootstrap";
import TopNav from './TopNav';
import Toolbar from './Toolbar';
import CanvasContainer from './CanvasContainer';
import Model from '../model/Model';
import { BezierToolOptions, Mode } from '../model/BezierTool';

const prettyjson = require('prettyjson');

export interface ApplicationProps { model: Model }
export interface ApplicationState {
    log: string,
    toolbarOptions: BezierToolOptions,
    toolbarMode: Mode,
    srcImageURL: string
}

export default class Application extends React.Component<ApplicationProps, ApplicationState> {

    private _modeChangeHandler: any = this.onModeChange.bind(this);

    componentWillMount() {
        console.log(`Application: componentWillMount: `);
        this.setState({
            log: '',
            toolbarOptions: this.props.model.bezierTool.options,
            toolbarMode: this.props.model.bezierTool.mode,
            srcImageURL: 'assets/peter-rabbit.jpg'
        });
    }

    componentDidMount() {
        this.props.model.bezierTool.setupUI();
        this.props.model.bezierTool.addListener('modeChange', this._modeChangeHandler);
    }

    onModeChange() {
        console.log(`Application: onModeChange:`);
        this.setState({
            toolbarMode: this.props.model.bezierTool.mode
        });
    }

    componentWillUnmount() {
        this.props.model.bezierTool.removeListener('modeChange', this._modeChangeHandler);
    }

    onTopNavClick(event: any): void {
        let nativeEvent: any = event.nativeEvent;
        switch (nativeEvent.target.id) {
            case 'tbd':
                break;
        }
    }

    onToolbarClick(event: any, type: string = ''): void {
        let nativeEvent: any = event.nativeEvent;
        // console.log(nativeEvent, nativeEvent.target);
        let name = nativeEvent.target.name;
        let id = nativeEvent.target.id;
        let parentName = nativeEvent.target.parentElement.name;
        let parentId = nativeEvent.target.parentElement.id
        // console.log(`name: ${name}, id: ${id}, parentName: ${parentName}, parentId: ${parentId}`);
        if (type === "tool") {
            let tool = id || parentId;
            // console.log(`Tool: ${tool}`);
            let mode = Mode.Selecting;
            switch (tool) {
                case 'pan':
                    console.log(`SetMode: Panning`);
                    mode = Mode.Panning;
                    break;
                case 'select':
                    console.log(`SetMode: Selecting`);
                    mode = Mode.Selecting;
                    break;
                case 'add':
                    console.log(`SetMode: Adding`);
                    mode = Mode.Adding;
                    break;
                case 'draw':
                    console.log(`SetMode: Drawing`);
                    mode = Mode.Drawing;
                    break;
                case 'edit':
                    console.log(`SetMode: Editing`);
                    mode = Mode.Editing;
                    break;
                case 'delete':
                    console.log(`SetMode: Removing`);
                    mode = Mode.Removing;
                    break;
                case 'insert':
                    console.log(`SetMode: Inserting`);
                    mode = Mode.Inserting;
                    break;
                case 'modify':
                    console.log(`SetMode: Modifying`);
                    mode = Mode.Modifying;
                    break;
            }
            this.props.model.bezierTool.setMode(mode);
            this.setState({
                toolbarMode: this.props.model.bezierTool.mode
            });
        } else if (name === "smoothing") {
            let value = Number(nativeEvent.target.text);
            console.log(`Smoothing: ${value}`);
            this.props.model.bezierTool.setSmoothing(value);
        } else if (name === "spacing") {
            let value = Number(nativeEvent.target.text);
            console.log(`Spacing: ${value}`);
            this.props.model.bezierTool.setSpacing(value);
        } else if (id === "toggles") {
            let firstChild = nativeEvent.target.firstChild;
            // console.log("toggles", firstChild);
            if (firstChild) {
                let value = Number(firstChild.value);
                let checked = !firstChild.checked; //checking state before being toggled
                switch (value) {
                    case 1:
                        console.log(`LockControls: ${checked}`);
                        this.props.model.bezierTool.lockControls(checked);
                        break;
                    case 2:
                        console.log(`HideAnchors: ${checked}`);
                        this.props.model.bezierTool.hideAnchors(checked);
                        break;
                    case 3:
                        console.log(`HideControls: ${checked}`);
                        this.props.model.bezierTool.hideControls(checked);
                        break;
                }
            }
        } else if (name === "clear") {
            this.props.model.bezierTool.clearAllPoints();
            console.log(`Clear all Points`);
        }

    }

    onDownloadClick(event: any): void {
        let id = event.nativeEvent.target.id;
        switch (id) {
            case 'downloadSVG':
                this.props.model.bezierTool.downloadSVG();
                break;
            case 'downloadJSON':
                this.props.model.bezierTool.downloadJSON();
                break;
        }
    }

    handleInputChange(event: any) {
    let nativeEvent: any = event.nativeEvent;
    switch(nativeEvent.target.name) {
        case 'imageSrc':
            this.setState({ srcImageURL: nativeEvent.target.value});
            break;
    }
}

    layout(): any {
        let layout =
        <ReactBootstrap.Grid>
                <ReactBootstrap.Row>
                    <ReactBootstrap.Col>
                        <TopNav clickHandler={this.onTopNavClick.bind(this)} />
                    </ReactBootstrap.Col>
                </ReactBootstrap.Row>
                <ReactBootstrap.Row>
                    <ReactBootstrap.Col>
                        <Toolbar clickHandler={this.onToolbarClick.bind(this)} options={this.props.model.bezierTool.options} mode={this.props.model.bezierTool.mode} />
                        <CanvasContainer canvasId={"bezierCanvas"} width={500} height={375} />
                        <CanvasContainer canvasId={"bitmapCanvas"} width={500} height={375} />
                    </ReactBootstrap.Col>
                </ReactBootstrap.Row>
                <ReactBootstrap.Row>
                    <ReactBootstrap.Col>
                        <ReactBootstrap.FormGroup>
                            <ReactBootstrap.Button id="addImgSrc">Set Canvas Background</ReactBootstrap.Button>
                            <ReactBootstrap.FormControl type="text" id="imageSrc" name="imageSrc" value={this.state.srcImageURL} onChange={this.handleInputChange.bind(this)} style={{width: "300px", display: "inline-block"}}/>
                        </ReactBootstrap.FormGroup>
                        <ReactBootstrap.ButtonGroup onClick={this.onDownloadClick.bind(this)}>
                            <ReactBootstrap.Button id="downloadSVG">Downlod SVG</ReactBootstrap.Button>
                            <ReactBootstrap.Button id="downloadJSON">Downlod JSON</ReactBootstrap.Button>
                        </ReactBootstrap.ButtonGroup>
                    </ReactBootstrap.Col>
                </ReactBootstrap.Row>
            </ReactBootstrap.Grid>;

        return layout;
    }

    render() {
        return (
            this.layout()
        );
    }
}
