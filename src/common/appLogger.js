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

const logLevel = log;
logLevel.setLevel('TRACE', false);

export default logLevel;
