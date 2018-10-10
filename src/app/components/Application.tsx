import * as React from "react";
import * as ReactBootstrap from "react-bootstrap";
import TopNav from './TopNav';
import Model from '../model/Model';

const prettyjson = require('prettyjson');

export interface ApplicationProps { model: Model }
export interface ApplicationState {
    log: string
}

export default class Application extends React.Component<ApplicationProps, ApplicationState> {

    componentWillMount() {
        console.log(`Application: componentWillMount: `);
        this.setState({
            log: ''
        });
    }

    componentDidMount() {
    }

    onTopNavClick(event: any): void {
        let nativeEvent: any = event.nativeEvent;
        switch (nativeEvent.target.id) {
            case 'tbd':
                break;
        }
    }

    layout(): any {
        let layout = <div>
            <TopNav clickHandler={this.onTopNavClick.bind(this)} />
        </div>;
        /*
            <ReactBootstrap.Grid>
                <ReactBootstrap.Row>
                    <ReactBootstrap.Col>
                        <TopNav clickHandler={this.onTopNavClick.bind(this)} />
                    </ReactBootstrap.Col>
                </ReactBootstrap.Row>
                <ReactBootstrap.Row>
                    <ReactBootstrap.Col>
                        <ReactBootstrap.ButtonToolbar>
                            <ReactBootstrap.ButtonGroup>
                                <ReactBootstrap.Button>Sel</ReactBootstrap.Button>
                                <ReactBootstrap.Button>Add</ReactBootstrap.Button>
                                <ReactBootstrap.Button>Rmv</ReactBootstrap.Button>
                                <ReactBootstrap.Button>Drw</ReactBootstrap.Button>
                                <ReactBootstrap.DropdownButton title="Smoothing" id="bg-nested-dropdown">
                                    <ReactBootstrap.MenuItem eventKey="0">0</ReactBootstrap.MenuItem>
                                    <ReactBootstrap.MenuItem eventKey="1">10</ReactBootstrap.MenuItem>
                                    <ReactBootstrap.MenuItem eventKey="2">20</ReactBootstrap.MenuItem>
                                    <ReactBootstrap.MenuItem eventKey="3">30</ReactBootstrap.MenuItem>
                                    <ReactBootstrap.MenuItem eventKey="4">40</ReactBootstrap.MenuItem>
                                    <ReactBootstrap.MenuItem eventKey="5">50</ReactBootstrap.MenuItem>
                                    <ReactBootstrap.MenuItem eventKey="6" active>60</ReactBootstrap.MenuItem>
                                    <ReactBootstrap.MenuItem eventKey="7">70</ReactBootstrap.MenuItem>
                                    <ReactBootstrap.MenuItem eventKey="8">80</ReactBootstrap.MenuItem>
                                    <ReactBootstrap.MenuItem eventKey="9">90</ReactBootstrap.MenuItem>
                                    <ReactBootstrap.MenuItem eventKey="10">100</ReactBootstrap.MenuItem>
                                </ReactBootstrap.DropdownButton>
                                <ReactBootstrap.DropdownButton title="Spacing" id="bg-nested-dropdown">
                                    <ReactBootstrap.MenuItem eventKey="0">0</ReactBootstrap.MenuItem>
                                    <ReactBootstrap.MenuItem eventKey="1" active>10</ReactBootstrap.MenuItem>
                                    <ReactBootstrap.MenuItem eventKey="2">20</ReactBootstrap.MenuItem>
                                    <ReactBootstrap.MenuItem eventKey="3">30</ReactBootstrap.MenuItem>
                                    <ReactBootstrap.MenuItem eventKey="4">40</ReactBootstrap.MenuItem>
                                    <ReactBootstrap.MenuItem eventKey="5">50</ReactBootstrap.MenuItem>
                                    <ReactBootstrap.MenuItem eventKey="6">60</ReactBootstrap.MenuItem>
                                    <ReactBootstrap.MenuItem eventKey="7">70</ReactBootstrap.MenuItem>
                                    <ReactBootstrap.MenuItem eventKey="8">80</ReactBootstrap.MenuItem>
                                    <ReactBootstrap.MenuItem eventKey="9">90</ReactBootstrap.MenuItem>
                                    <ReactBootstrap.MenuItem eventKey="10">100</ReactBootstrap.MenuItem>
                                </ReactBootstrap.DropdownButton>
                            </ReactBootstrap.ButtonGroup>
                            <ReactBootstrap.ToggleButtonGroup type="checkbox" defaultValue={[1]}>
                                <ReactBootstrap.ToggleButton value={1}>Lock Controls</ReactBootstrap.ToggleButton>
                                <ReactBootstrap.ToggleButton value={2}>Hide Anchors</ReactBootstrap.ToggleButton>
                                <ReactBootstrap.ToggleButton value={3}>Hide Controls</ReactBootstrap.ToggleButton>
                            </ReactBootstrap.ToggleButtonGroup>
                        </ReactBootstrap.ButtonToolbar>
                    </ReactBootstrap.Col>
                </ReactBootstrap.Row>
            </ReactBootstrap.Grid>;
            */
        return layout;
    }

    render() {
        return (
            this.layout()
        );
    }
}
