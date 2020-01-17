import React from 'react';
import './Preview.css';
import { EDITOR_FONTS } from './editor/props';


const styles = {
    fontFamily: EDITOR_FONTS
};

export default class Preview extends React.Component {
    render() {
        return <div className="app-preview" style={styles}>
            Press "Run" to compile program.
        </div>;
    }
}