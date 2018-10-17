import * as React from "react";
import * as ReactBootstrap from "react-bootstrap";
import { BezierToolOptions, Mode } from '../model/BezierTool';


export interface ToolbarProps { clickHandler: any, options: BezierToolOptions, mode: Mode }
export interface ToolbarState { }

export default class Toolbar extends React.Component<ToolbarProps, ToolbarState> {

    componentWillMount() {
        this.setState({});
    }

    componentDidMount() {
    }

    onClick(event: any) {
        // event.preventDefault();
        // event.stopPropagation();
        this.props.clickHandler(event);
    }

    onToolClick(event: any) {
        // event.preventDefault();
        // event.stopPropagation();
        this.props.clickHandler(event, "tool");
    }

    render() {

        let mode: string = Mode[this.props.mode];
        console.log(`Toolbar: render: `, this.props.mode, mode, this.props.options);
        let toggles = [];
        if (this.props.options.createSmoothLineSegments) toggles.push(1);
        if (this.props.options.hideAnchorPoints) toggles.push(2);
        if (this.props.options.hideControlPoints) toggles.push(3);
        let spacingTitle: string = `Spacing (${this.props.options.minDrawPointSpacing})`;
        let smoothingTitle: string = `Smoothing (${this.props.options.simplifyPathTolerance})`;
        return (
            <ReactBootstrap.ButtonToolbar onClick={this.onClick.bind(this)}>
                <ReactBootstrap.ToggleButtonGroup type="radio" name="tools" value={mode} onClick={this.onToolClick.bind(this)}>
                    <ReactBootstrap.ToggleButton id="pan" name="tool" value={"Panning"}><ReactBootstrap.Image src="assets/cursors/pan.png"></ReactBootstrap.Image></ReactBootstrap.ToggleButton>
                    <ReactBootstrap.ToggleButton id="select" name="tool" value={"Selecting"}><ReactBootstrap.Image src="assets/cursors/select.png"></ReactBootstrap.Image></ReactBootstrap.ToggleButton>
                    <ReactBootstrap.ToggleButton id="add" name="tool" value={"Adding"}><ReactBootstrap.Image src="assets/cursors/add.png"></ReactBootstrap.Image></ReactBootstrap.ToggleButton>
                    <ReactBootstrap.ToggleButton id="draw" name="tool" value={"Drawing"}><ReactBootstrap.Image src="assets/cursors/draw.png"></ReactBootstrap.Image></ReactBootstrap.ToggleButton>
                    <ReactBootstrap.ToggleButton id="edit" name="tool" value={"Editing"}><ReactBootstrap.Image src="assets/cursors/edit.png"></ReactBootstrap.Image></ReactBootstrap.ToggleButton>
                    <ReactBootstrap.ToggleButton id="delete" name="tool" value={"Removing"}><ReactBootstrap.Image src="assets/cursors/delete.png"></ReactBootstrap.Image></ReactBootstrap.ToggleButton>
                    <ReactBootstrap.ToggleButton id="insert" name="tool" value={"Inserting"}><ReactBootstrap.Image src="assets/cursors/insert.png"></ReactBootstrap.Image></ReactBootstrap.ToggleButton>
                    <ReactBootstrap.ToggleButton id="modify" name="tool" value={"Modifying"}><ReactBootstrap.Image src="assets/cursors/modify.png"></ReactBootstrap.Image></ReactBootstrap.ToggleButton>
                </ReactBootstrap.ToggleButtonGroup>
                <ReactBootstrap.ButtonGroup>
                    <ReactBootstrap.DropdownButton title={smoothingTitle} id="bg-nested-dropdown">
                        <ReactBootstrap.MenuItem name={"smoothing"} eventKey="0">0</ReactBootstrap.MenuItem>
                        <ReactBootstrap.MenuItem name={"smoothing"} eventKey="3">30</ReactBootstrap.MenuItem>
                        <ReactBootstrap.MenuItem name={"smoothing"} eventKey="6">60</ReactBootstrap.MenuItem>
                        <ReactBootstrap.MenuItem name={"smoothing"} eventKey="9">90</ReactBootstrap.MenuItem>
                    </ReactBootstrap.DropdownButton>
                    <ReactBootstrap.DropdownButton title={spacingTitle} id="bg-nested-dropdown">
                        <ReactBootstrap.MenuItem name={"spacing"} eventKey="0">0</ReactBootstrap.MenuItem>
                        <ReactBootstrap.MenuItem name={"spacing"} eventKey="5">5</ReactBootstrap.MenuItem>
                        <ReactBootstrap.MenuItem name={"spacing"} eventKey="10">10</ReactBootstrap.MenuItem>
                        <ReactBootstrap.MenuItem name={"spacing"} eventKey="20">20</ReactBootstrap.MenuItem>
                        <ReactBootstrap.MenuItem name={"spacing"} eventKey="30">30</ReactBootstrap.MenuItem>
                        <ReactBootstrap.MenuItem name={"spacing"} eventKey="40">40</ReactBootstrap.MenuItem>
                    </ReactBootstrap.DropdownButton>
                </ReactBootstrap.ButtonGroup>
                <ReactBootstrap.ToggleButtonGroup type="checkbox" defaultValue={toggles}>
                    <ReactBootstrap.ToggleButton id={"toggles"} value={1}>Lock Controls</ReactBootstrap.ToggleButton>
                    <ReactBootstrap.ToggleButton id={"toggles"} value={2}>Hide Anchors</ReactBootstrap.ToggleButton>
                    <ReactBootstrap.ToggleButton id={"toggles"} value={3}>Hide Controls</ReactBootstrap.ToggleButton>
                </ReactBootstrap.ToggleButtonGroup>
                <ReactBootstrap.Button id="clear" name="clear">Clear</ReactBootstrap.Button>
            </ReactBootstrap.ButtonToolbar>
        );
    }
}
