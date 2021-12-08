import React, { Component } from "react";
import { Container } from "reactstrap";

import Select from "react-select";
import { getTokenOrRefresh } from "./utils/token_util";
import "./custom.css";
import { ResultReason } from "microsoft-cognitiveservices-speech-sdk";

const speechsdk = require("microsoft-cognitiveservices-speech-sdk");
const options = [
  { value: "tr", label: "Turkish", translation: "Türkçe:" },
  { value: "es", label: "Spanish", translation: "Español:" },
  { value: "pt-pt", label: "Portuguese", translation: "Português:" },
  { value: "ro", label: "Romanian", translation: "Română:" },
  { value: "tlh-Latn", label: "Klingon", translation: "Klingon:" },
];

export default class App extends Component {
  constructor(props) {
    super(props);

    this.state = {
      displayText: "INITIALIZED: ready to test speech...",
      tr: "",
      es: "",
      pt: "",
    };
  }

  async componentDidMount() {
    // check for valid speech key/region
    const tokenRes = await getTokenOrRefresh();
    if (tokenRes.authToken === null) {
      this.setState({
        displayText: "FATAL_ERROR: " + tokenRes.error,
      });
    }
  }

  async sttFromMic() {
    this.setState({
      displayText: "speak into your microphone...",
    });

    const tokenObj = await getTokenOrRefresh();
    const speechConfig =
      speechsdk.SpeechTranslationConfig.fromAuthorizationToken(
        tokenObj.authToken,
        tokenObj.region
      );
    speechConfig.speechRecognitionLanguage = "en-US";
    options.forEach((option) => {
      speechConfig.addTargetLanguage(option.value);
    });

    const audioConfig = speechsdk.AudioConfig.fromDefaultMicrophoneInput();
    const recognizer = new speechsdk.TranslationRecognizer(
      speechConfig,
      audioConfig
    );

    recognizer.recognizing = (s, e) => {
      console.log("recognizing ", e);
      let result = "";
      if (
        e.result.reason == ResultReason.RecognizedSpeech
) {
        result = `TRANSLATED: Text=${e.result.text}`;
      } else if (e.result.reason == ResultReason.NoMatch) {
        result = "NOMATCH: Speech could not be translated.";
      }
      console.log(result);
      this.setState({
        tr: e.result.translations.get("tr"),
        es: e.result.translations.get("es"),
        it: e.result.translations.get("tlh-Latn"),
        displayText: e.result.text,
      });
    };

    recognizer.recognized = (s, e) => {
      console.log("recognized ", e);
      this.setState({
        displayText: `RECOGNIZED: ${e.result.text}`,
        tr: e.result.translations.get("tr"),
        es: e.result.translations.get("es"),
        it: e.result.translations.get("tlh-Latn"),
      });
    };

    recognizer.startContinuousRecognitionAsync();

    // recognizer.recognizeOnceAsync((result) => {
    //   if (
    //     result.reason === ResultReason.RecognizedSpeech ||
    //     result.reason === ResultReason.RecognizedSpeech
    //   ) {
    //     this.setState({
    //       displayText: "SPEECH_RECOGNIZED: " + result.text,
    //       translatedText: "Translated: " + result.translations[0].text,
    //     });
    //   } else if (result.reason === ResultReason.Canceled) {
    //     const cancellation = speechsdk.CancellationDetails.fromResult(result);
    //     this.setState({
    //       displayText:
    //         "CANCELED: Reason=" +
    //         cancellation.reason +
    //         ", ErrorDetails=" +
    //         cancellation.errorDetails,
    //     });
    //   }
    // });
  }

  async fileChange(event) {
    const audioFile = event.target.files[0];
    console.log(audioFile);
    const fileInfo = audioFile.name + ` size=${audioFile.size} bytes `;

    this.setState({
      displayText: fileInfo,
    });

    const tokenObj = await getTokenOrRefresh();
    const speechConfig = speechsdk.SpeechConfig.fromAuthorizationToken(
      tokenObj.authToken,
      tokenObj.region
    );
    speechConfig.speechRecognitionLanguage = "en-US";

    const audioConfig = speechsdk.AudioConfig.fromWavFileInput(audioFile);
    const recognizer = new speechsdk.SpeechRecognizer(
      speechConfig,
      audioConfig
    );

    recognizer.recognizeOnceAsync((result) => {
      let displayText;
      if (result.reason === ResultReason.RecognizedSpeech) {
        displayText = `RECOGNIZED: Text=${result.text}`;
      } else {
        displayText =
          "ERROR: Speech was cancelled or could not be recognized. Ensure your microphone is working properly.";
      }

      this.setState({
        displayText: fileInfo + displayText,
      });
    });
  }

  render() {
    return (
      <Container className="app-container">
        <h1 className="display-4 mb-3">Speech sample app</h1>

        <div className="row main-container">
          <div className="col-12">
            <i
              className="fas fa-microphone fa-lg mr-2"
              onClick={() => this.sttFromMic()}
            ></i>
            Convert speech to text from your mic.
            <div className="mt-2">
              <label htmlFor="audio-file">
                <i className="fas fa-file-audio fa-lg mr-2"></i>
              </label>
              <input
                type="file"
                id="audio-file"
                onChange={(e) => this.fileChange(e)}
                style={{ display: "none" }}
              />
              Convert speech to text from an audio file.
            </div>
            <div className="mt-2" onClick={() => this.sttFromMic()}>
              <label htmlFor="translate">
                <i className="fas fa-language fa-lg mr-2"></i>
              </label>
              Translate.
              <Select
                options={options}
                defaultValue={options[0]}
                isMulti
                name="languages"
                onChange={(e) => this.setState({ translatedLanguage: e.value })}
              />
            </div>
          </div>
          <div className="col-3 output-display rounded">
            <code>{this.state.displayText}</code>
          </div>
          <div className="col-3 output-display rounded">
            <code>Türkçe: {this.state.tr}</code>
          </div>
          <div className="col-3 output-display rounded">
            <code>Español: {this.state.es}</code>
          </div>
          <div className="col-3 output-display rounded">
            <code>Klingon: {this.state.it}</code>
          </div>
        </div>
      </Container>
    );
  }
}
