import { Label } from 'cc';
import { _decorator, Component, Node, sys } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('Localization')
export class Localization extends Component {

    @property({ type: String })
    english: string;

    @property({ type: String })
    spanish: string;

    @property({ type: String })
    turkish: string;;

    @property({ type: String })
    russian: string;

    @property({ type: String })
    japanese: string

    @property({ type: String })
    korean: string;

    @property({ type: String })
    portuguese: string;

    @property({ type: String })
    german: string

    @property({ type: String })
    dutch: string

    @property({ type: String })
    italian: string

    @property({ type: String })
    french: string;

    @property({ type: String })
    urdu: string;

    @property({ type: String })
    chinese: string;
 

    start() {
        const label = this.node.getComponent(Label);
        if (label) {
            const deviceLanguage = sys.language;
            switch (deviceLanguage) {
                //case 'en': // English
                //    label.string = this.english;
                //    break;

                case 'es': // Spanish
                    label.string = this.spanish;
                    break;

                case 'tr': // Turkish
                    label.string = this.turkish;
                    break;

                case 'ru': // Russian
                    label.string = this.russian;
                    label.isBold = true;
                    break;

                case 'ja': // Japanese
                    label.string = this.japanese;
                    break;

                case 'ko': // Korean
                    label.string = this.korean;
                    break;

                case 'pt': // Portuguese
                    label.string = this.portuguese;
                    break;

                case 'de': // German
                    label.string = this.german;
                    break;

                case 'du': // Dutch
                    label.string = this.dutch;
                    break;

                case 'it': // Italian
                    label.string = this.italian;
                    break;

                case 'fr': // French
                    label.string = this.french;
                    break;

                //case 'ur': // Urdu
                //    label.string = this.urdu;
                //    break;

                case 'zh': // Chinese
                    label.string = this.chinese;
                    break;


                default:
                    //console.log('Language not supported, using default');
                    label.string = this.english;
                    break;
            }
        }
    }
}

