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

    render() {
        return (
            <div className="topNav" onClick={this.onButtonClicked.bind(this)} >
                <div className="topTitle">
                    <h4>React Typescript Bezier Tool</h4>
                </div>
            </div>
        );
    }
}
