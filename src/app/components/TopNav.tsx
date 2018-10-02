import * as React from "react";
import * as ReactBootstrap from "react-bootstrap";


export interface TopNavProps { clickHandler: any }
export interface TopNavState { }

export default class TopNav extends React.Component<TopNavProps, TopNavState> {

    componentWillMount() {
        this.setState({});
    }

    componentDidMount() {
    }

    onButtonClicked(event: any) {
        this.props.clickHandler(event);
    }

    onLogoClicked(): void {
        var win = window.open('http://wwlib.github.io', '_blank');
        win.focus();
    }

    render() {
        return (
            <div className="topNav" onClick={this.onButtonClicked.bind(this)} >
                <div className="topTitle">
                    <img className="topLogo" src={'assets/ww-logo-40.png'} style={{width: 40}} onClick={this.onLogoClicked.bind(this)}/>
                    <h4>React TypeScript Bezier Tool</h4>
                </div>
            </div>
        );
    }
}
