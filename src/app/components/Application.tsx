import * as React from "react";
import * as ReactBootstrap from "react-bootstrap";
import TopNav from './TopNav';
import Model from '../model/Model';

const prettyjson = require('prettyjson');

export interface ApplicationProps { model: Model }
export interface ApplicationState {
    log: string
}

export default class Application extends React.Component < ApplicationProps, ApplicationState > {

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
        switch ( nativeEvent.target.id) {
            case 'tbd':
                break;
        }
    }

    layout(): any {
        let layout;
        layout = <div>
            <TopNav  clickHandler={this.onTopNavClick.bind(this)} />
        </div>
        return layout;
    }

    render() {
        return(
            this.layout()
        );
    }
}
