import { dispatchImportFile, store } from '../store';
import { saveAs } from 'file-saver';

export const loadFile = (f: File) => {
    return new Promise((res, rej) => {
        const reader = new FileReader();
        reader.onload = e => {
            const data = e.target?.result as string;
            dispatchImportFile(f.name, data);
            res(data);
        };

        reader.onerror = e => {
            rej(e);
        };

        reader.readAsText(f, 'UTF-8');
    });
};

export const saveEditorContents = () => {
    return new Promise((res, rej) => {
        try {
            const {fileName, code } = store.getState();
            const blob = new Blob([code], {type: 'text/plain;charset=utf-8'});
            saveAs(blob, fileName);
            res();
        } catch (err) {
            rej(err)
        }
    })
};

