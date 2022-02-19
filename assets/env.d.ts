declare global {
    namespace NodeJS {
        // ! booleans are not supported and number must be casted using + operator
        interface ProcessEnv {
            NODE_ENV: 'development' | 'production' | 'test';
            ENV: 'dev' | 'qa' | 'prod';
            DEBUG?: string;

            // SECTION: project info from package.json
            VERSION: string;
            PROJECT: string;
            NAME: string;
            TITLE: string;
            DESCRIPTION: string;
        }
    }
}

export {};
