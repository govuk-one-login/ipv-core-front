import { drivingPermit, nameParts } from "../cri-stub-data-builders";
import {
  BirthDateClass,
  DrivingPermitDetailsClass,
  IdentityCheckSubjectClass,
} from "@govuk-one-login/data-vocab/credentials";

const aliceParkerName = nameParts(["ALICE", "JANE"], "PARKER");

const aliceParkerBirthDate: BirthDateClass = {
  value: "1970-01-01",
};

const aliceParkerDvlaPermit = (): DrivingPermitDetailsClass =>
  drivingPermit("PARKE710112PBFGA", "DVLA");

export const aliceParkerDvla = (): IdentityCheckSubjectClass => ({
  name: [aliceParkerName],
  birthDate: [aliceParkerBirthDate],
  drivingPermit: [aliceParkerDvlaPermit()],
});

export const alisonParkerDvla = (): IdentityCheckSubjectClass => ({
  ...aliceParkerDvla(),
  name: [nameParts(["ALISON", "JANE"], "PARKER")],
});
