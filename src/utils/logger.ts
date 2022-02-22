import { LoggerWithoutCallSite as Logger } from 'tslog';

/**
 * Global stdout wrap.
 */
export const logger = new Logger({
    displayDateTime: true,
    displayLoggerName: false,
    displayInstanceName: false,
    displayFunctionName: false,
    displayFilePath: 'hidden',
    dateTimePattern: 'hour:minute:second.millisecond',
    maskPlaceholder: '***'
});
