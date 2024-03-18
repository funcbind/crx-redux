import { sendMessage, onMessage } from 'webext-bridge/content-script';
import ProxyStore from './proxyStore';
import { EXTENSIONS_CONTEXTS } from '../chromeStorageRedux/contants';

const ContentScriptProxyStore = new ProxyStore(
	EXTENSIONS_CONTEXTS.CONTENT_SCRIPT,
	sendMessage,
	onMessage
);

export default ContentScriptProxyStore;
