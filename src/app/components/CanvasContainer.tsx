import * as React from "react";
import * as ReactBootstrap from "react-bootstrap";


export interface CanvasContainerProps { canvasId: string, width: number, height: number }
export interface CanvasContainerState { }

export default class CanvasContainer extends React.Component<CanvasContainerProps, CanvasContainerState> {

    componentWillMount() {
        this.setState({});
    }

    componentDidMount() {
    }

    render() {
        return (
            <canvas id={this.props.canvasId} width={this.props.width} height={this.props.height}></canvas>
        );
    }
}
