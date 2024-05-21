/* eslint-disable no-undef */
import log from 'loglevel';

// var originalFactory = log.methodFactory;
// log.methodFactory = function (methodName, logLevel, loggerName) {
// 	var rawMethod = originalFactory(methodName, logLevel, loggerName);

// 	return function () {
// 		var messages = ['Newsflash:'];
// 		Array.from(arguments).forEach((arg) => messages.push(arg));
// 		rawMethod.apply(undefined, messages);
// 	};
// };
// log.rebuild();
log.setLevel('TRACE', false);

log.warn(`Inside app logger...`);
log.info(`Inside app logger...`);
log.trace(`Inside app logger...`);
log.debug(`Inside app logger...`);

export { log as loglevel };
