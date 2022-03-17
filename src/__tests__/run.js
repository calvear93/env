function validateEnv(...vars) {
    for(const key of vars) {
        if(!process.env[key])
        {
            throw new Error(`${key} dont loaded`);
        }
    }
}

validateEnv(
    'ENV',
    'VERSION',
    'PROJECT',
    'NAME',
    'TITLE',
    'DESCRIPTION',
    'VAR1',
    'C1',
    'C2',
    'C3',
    'C4',
    'GROUP1__VAR2',
    'GROUP1__VAR3',
    'GROUP1__GROUP2__VAR1',
    'NODE_ENV',
    'VAR2',
    'VAR3',
    'VAR4',
    'ARR1',
    'GROUP2__VAR1',
    'GROUP2__VAR2'
);
