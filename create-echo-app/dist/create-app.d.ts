export interface CreateAppConfig {
    projectName: string;
    template: string;
    useNpm?: boolean;
    useYarn?: boolean;
    usePnpm?: boolean;
}
export declare const createApp: (config: CreateAppConfig) => Promise<void>;
//# sourceMappingURL=create-app.d.ts.map