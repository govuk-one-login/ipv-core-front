import { StubPage } from "./stub-page";

export class DrivingLicenceStubPage extends StubPage {
  async processAliceParkerValid(): Promise<void> {
    await this.selectTestData("Alice Parker (Valid) DVLA Licence");
    await this.setEvidenceScores({
      strength: "3",
      validity: "2",
      activityHistory: "1",
    });
    await this.submitData();
  }

  async processAliceParkerNameChange(): Promise<void> {
    await this.selectTestData("Alice Parker (Changed First Name) DVLA Licence");
    await this.setEvidenceScores({
      strength: "3",
      validity: "2",
      activityHistory: "1",
    });
    await this.submitData();
  }
}
