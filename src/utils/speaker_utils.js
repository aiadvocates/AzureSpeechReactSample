import { getTokenOrRefresh } from "./token_util";
const sdk = require("microsoft-cognitiveservices-speech-sdk");
const fs = require("fs");

const subscriptionKey = process.env.SPEECH_KEY;
const profile_locale = "en-US";
const ticks_per_second = 10000000;
const passphrase_files = [
  "../assets/myVoiceIsMyPassportVerifyMe01.wav",
  "../assets/myVoiceIsMyPassportVerifyMe02.wav",
  "../assets/myVoiceIsMyPassportVerifyMe03.wav",
];

const identify_file = "../assets/aboutSpeechSdk.wav";

const verify_file = "../assets/myVoiceIsMyPassportVerifyMe04.wav";

export async function getAudioConfigFromFile(file) {
  let pushStream = sdk.AudioInputStream.createPushStream();
  fs.createReadStream(file)
    .on("data", (arrayBuffer) => {
      pushStream.write(arrayBuffer.buffer);
    })
    .on("end", () => {
      pushStream.close();
    });
  return sdk.AudioConfig.fromStreamInput(pushStream);
}

export async function TextDependentVerification(client, speech_config) {
  console.log("Text Dependent Verification:\n");
  var profile = null;
  try {
    // Create the profile.
    profile = await new Promise((resolve, reject) => {
      client.createProfileAsync(
        sdk.VoiceProfileType.TextDependentVerification,
        profile_locale,
        (result) => {
          resolve(result);
        },
        (error) => {
          reject(error);
        }
      );
    });
    console.log("Created profile ID: " + profile.profileId);
    await AddEnrollmentsToTextDependentProfile(
      client,
      profile,
      passphrase_files
    );
    const audio_config = getAudioConfigFromFile(verify_file);
    const recognizer = new sdk.SpeakerRecognizer(speech_config, audio_config);
    await SpeakerVerify(profile, recognizer);
  } catch (error) {
    console.log("Error:\n" + error);
  } finally {
    if (profile !== null) {
      console.log("Deleting profile ID: " + profile.profileId);
      await new Promise((resolve, reject) => {
        client.deleteProfileAsync(
          profile,
          (result) => {
            resolve(result);
          },
          (error) => {
            reject(error);
          }
        );
      });
    }
  }
}

async function AddEnrollmentsToTextIndependentProfile(
  client,
  profile,
  audio_files
) {
  for (var i = 0; i < audio_files.length; i++) {
    console.log("Adding enrollment to text independent profile...");
    const audio_config = getAudioConfigFromFile(audio_files[i]);
    const result = await new Promise((resolve, reject) => {
      client.enrollProfileAsync(
        profile,
        audio_config,
        (result) => {
          resolve(result);
        },
        (error) => {
          reject(error);
        }
      );
    });
    if (result.reason === sdk.ResultReason.Canceled) {
      throw JSON.stringify(
        sdk.VoiceProfileEnrollmentCancellationDetails.fromResult(result)
      );
    } else {
      console.log(
        "Remaining audio time needed: " +
          result.privDetails["remainingEnrollmentsSpeechLength"] /
            ticks_per_second +
          " seconds."
      );
    }
  }
  console.log("Enrollment completed.\n");
}

async function AddEnrollmentsToTextDependentProfile(
  client,
  profile,
  audio_files
) {
  for (var i = 0; i < audio_files.length; i++) {
    console.log("Adding enrollment to text dependent profile...");
    const audio_config = getAudioConfigFromFile(audio_files[i]);
    const result = await new Promise((resolve, reject) => {
      client.enrollProfileAsync(
        profile,
        audio_config,
        (result) => {
          resolve(result);
        },
        (error) => {
          reject(error);
        }
      );
    });
    if (result.reason === sdk.ResultReason.Canceled) {
      throw JSON.stringify(
        sdk.VoiceProfileEnrollmentCancellationDetails.fromResult(result)
      );
    } else {
      console.log(
        "Remaining enrollments needed: " +
          result.privDetails["remainingEnrollmentsCount"] +
          "."
      );
    }
  }
  console.log("Enrollment completed.\n");
}

async function SpeakerVerify(profile, recognizer) {
  const model = sdk.SpeakerVerificationModel.fromProfile(profile);
  const result = await new Promise((resolve, reject) => {
    recognizer.recognizeOnceAsync(
      model,
      (result) => {
        resolve(result);
      },
      (error) => {
        reject(error);
      }
    );
  });
  console.log(
    "Verified voice profile for speaker: " +
      result.profileId +
      ". Score is: " +
      result.score +
      ".\n"
  );
}

async function TextIndependentVerification(client, speech_config) {
  console.log("Text Independent Verification:\n");
  var profile = null;
  try {
    // Create the profile.
    profile = await new Promise((resolve, reject) => {
      client.createProfileAsync(
        sdk.VoiceProfileType.TextIndependentVerification,
        profile_locale,
        (result) => {
          resolve(result);
        },
        (error) => {
          reject(error);
        }
      );
    });
    console.log("Created profile ID: " + profile.profileId);
    await AddEnrollmentsToTextIndependentProfile(client, profile, [
      identify_file,
    ]);
    const audio_config = getAudioConfigFromFile(passphrase_files[0]);
    const recognizer = new sdk.SpeakerRecognizer(speech_config, audio_config);
    await SpeakerVerify(profile, recognizer);
  } catch (error) {
    console.log("Error:\n" + error);
  } finally {
    if (profile !== null) {
      console.log("Deleting profile ID: " + profile.profileId);
      await new Promise((resolve, reject) => {
        client.deleteProfileAsync(
          profile,
          (result) => {
            resolve(result);
          },
          (error) => {
            reject(error);
          }
        );
      });
    }
  }
}

async function TextIndependentIdentification(client, speech_config) {
  console.log("Text Independent Identification:\n");
  var profile = null;
  try {
    // Create the profile.
    profile = await new Promise((resolve, reject) => {
      client.createProfileAsync(
        sdk.VoiceProfileType.TextIndependentIdentification,
        profile_locale,
        (result) => {
          resolve(result);
        },
        (error) => {
          reject(error);
        }
      );
    });
    console.log("Created profile ID: " + profile.profileId);
    await AddEnrollmentsToTextIndependentProfile(client, profile, [
      identify_file,
    ]);
    const audio_config = getAudioConfigFromFile(passphrase_files[0]);
    const recognizer = new sdk.SpeakerRecognizer(speech_config, audio_config);
    await SpeakerIdentify(profile, recognizer);
  } catch (error) {
    console.log("Error:\n" + error);
  } finally {
    if (profile !== null) {
      console.log("Deleting profile ID: " + profile.profileId);
      await new Promise((resolve, reject) => {
        client.deleteProfileAsync(
          profile,
          (result) => {
            resolve(result);
          },
          (error) => {
            reject(error);
          }
        );
      });
    }
  }
}

async function SpeakerIdentify(profile, recognizer) {
console.log("Identifying speaker...");
  const model = sdk.SpeakerIdentificationModel.fromProfiles([profile]);
  const result = await new Promise((resolve, reject) => {
    recognizer.recognizeOnceAsync(
      model,
      (result) => {
        resolve(result);
      },
      (error) => {
        reject(error);
      }
    );
  });
  console.log(
    "The most similar voice profile is: " +
      result.profileId +
      " with similarity score: " +
      result.score +
      ".\n"
  );
}

async function autoDetectLanguage() { 
    const language = sdk.SpeechConfig.fromSubscription(
        subscriptionKey,
        'westus'
        
    ).speechRecognitionLanguage;
    console.log("Auto-detected language: " + language);
    };
    
    // var autoDetectConfig =
    //   SpeechSDK.AutoDetectSourceLanguageConfig.fromLanguages([
    //     "en-US",
    //     "de-DE",
    //   ]);
    // var speechRecognizer = SpeechSDK.SpeechRecognizer.FromConfig(
    //   speechConfig,
    //   autoDetectConfig,
    //   audioConfig
    // );
    // speechRecognizer.recognizeOnceAsync(
    //   (result: SpeechSDK.SpeechRecognitionResult) => {
    //     var languageDetectionResult =
    //       SpeechSDK.AutoDetectSourceLanguageResult.fromResult(result);
    //     var detectedLanguage = languageDetectionResult.language;
    //   },
    //   {}
    // );


export async function speakerIdentifyVerify() {
  const tokenObj = await getTokenOrRefresh();
  const speech_config = sdk.SpeechConfig.fromAuthorizationToken(
    tokenObj.token,
    tokenObj.region
  );
  const client = new sdk.VoiceProfileClient(speech_config);

//   await TextDependentVerification(client, speech_config);
  await TextIndependentVerification(client, speech_config);
  await TextIndependentIdentification(client, speech_config);
  console.log("End of quickstart.");
}

