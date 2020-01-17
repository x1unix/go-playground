import { dispatchImportFile } from '../store';

export const loadFile = async (f: File) => {
    const reader = new FileReader();
    reader.onload = e => {
        const data = e.target?.result as string;
        console.log(data);
        dispatchImportFile(data);
        Promise.resolve(data);
    };

    reader.onerror = e => {
        Promise.reject(e)
    };

    reader.readAsText(f, 'UTF-8');
};