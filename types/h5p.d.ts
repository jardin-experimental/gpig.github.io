declare module "h5p-standalone" {
    export interface H5POptions {
        h5pJsonPath: string;
        frameJs: string;
        frameCss: string;
        contentJsonPath?: string;
        librariesPath?: string;
        id?: string;
        frame?: boolean;
        copyright?: boolean;
        export?: boolean;
        icon?: boolean;
        downloadUrl?: string;
        embedUrl?: string;
        fullScreen?: boolean;
    }

    export class H5P {
        constructor(element: HTMLElement | null, options: H5POptions);
    }
}