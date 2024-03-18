import { sendMessage, onMessage } from 'webext-bridge/devtools';
import ProxyStore from './proxyStore';
import { EXTENSIONS_CONTEXTS } from '../chromeStorageRedux/contants';

const DevtoolsProxyStore = new ProxyStore(
	EXTENSIONS_CONTEXTS.DEVTOOLS,
	sendMessage,
	onMessage
);

export default DevtoolsProxyStore;
