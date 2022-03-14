function validateEnv(...vars) {
    for(const key of vars)
        if(!process.env[key])
            throw new Error(`${key} dont loaded`)
}

validateEnv('ENV', 'VERSION', 'PROJECT', 'C1', 'GROUP1__GROUP2__VAR1');
