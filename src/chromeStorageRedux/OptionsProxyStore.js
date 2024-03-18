import { sendMessage, onMessage } from 'webext-bridge/options';
import ProxyStore from './proxyStore';
import { EXTENSIONS_CONTEXTS } from '../chromeStorageRedux/contants';

const OptionsProxyStore = new ProxyStore(
	EXTENSIONS_CONTEXTS.OPTIONS,
	sendMessage,
	onMessage
);

export default OptionsProxyStore;
