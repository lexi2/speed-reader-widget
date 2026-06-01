import { registerElement } from './component/RsvpReader';
import { autoInstall } from './bootstrap/auto-install';

registerElement();
autoInstall();

export { RsvpReader } from './component/RsvpReader';
