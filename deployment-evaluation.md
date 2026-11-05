# Deployment proof of concept

Status — ready to run. No candidate has been tested or selected. See [overview](overview.md) and FR-015.

## Setup

Run the same scenarios on an OpenAI Sites candidate and an independently hosted PWA candidate. Use synthetic child records and a test-only catalog with two releases. Release A contains a milestone and two ordered activities. Release B withdraws one activity, changes the other, and includes a change summary. Use a private test mail address, two independent browser profiles, and two devices including a phone. Record device, browser, app version, date and test conditions. Save only redacted evidence. Use a test-only way to simulate elapsed time for expiry cases, then verify that the production path does not expose that control.

## Required checks

| ID | Scenario | Pass condition |
| --- | --- | --- |
| POC-01 | Open the forwarded URL in a clean browser. Attempt to load the catalog or an asset URL directly without authorization. | The entry point can explain access. Protected catalog and assets cannot be fetched without an invitation, including through any underlying hosting or caching URL. |
| POC-02 | Verify an invited email on two devices. Try an uninvited address and a used or expired verification challenge. | The invited parent can browse without a child profile. The other attempts do not authorize access. Verifying on device two transfers no personal records. |
| POC-03 | View a milestone and activity online. Reopen offline after closing the browser. Save a practice entry and reopen again. | Cached essentials and the entry are available. Uncached views and external links have a clear offline state. |
| POC-04 | Simulate just before and at seven days from the last successful access check. Restart offline and attempt to open a previously cached direct route. Reconnect with the invitation revoked. | Cached guide access works before expiry and blocks at expiry or on known revocation. An unsuccessful network check never extends access. Local encrypted export remains available. Record clock rollback behavior and how the implementation protects against restoring older authorization state. |
| POC-05 | Export a backup and restore it on device two. Try a wrong password, a modified file and a cancelled restore first. | Failed and cancelled restores leave existing records intact. Successful restore transfers the three personal collections. Invitation state is separate. |
| POC-06 | Examine network requests and deployment telemetry while changing age, saving favorites and adding a uniquely identifiable fictional note. | Birth data, age, favorites and practice records stay on the device. The note does not appear in requests, URLs, diagnostics or telemetry. |
| POC-07 | Attempt publication with an invalid link, then publish release B. Interrupt its first download. | Invalid content never becomes current. The failed refresh leaves release A active. A successful refresh applies B, shows its change summary, hides withdrawn instructions and keeps the labeled favorite and notes. |
| POC-08 | Examine editor and parent permissions. Try the publishing operation with parent authorization. | Only the designated maintainer can publish. The editor workflow does not receive personal records. |
| POC-09 | Capture the support and operating model. | Document compatible mobile browsers, service and email costs, recurring maintenance, deployment restrictions and any external service the candidate needs. Identify which claims were verified in a running test and which still depend on documentation or policy review. |

## Results to record

For each candidate and check, record **Pass**, **Fail**, or **Unverified**, with the test evidence and any dependency. For a failure, record whether an in-scope configuration change can resolve it. Repeat affected checks after changes. A candidate with a failed or unverified mandatory check cannot be selected yet. A failed check needs a working mitigation or an explicit product decision changing the requirement.

The offline check concerns normal operation of the app on the device. A disconnected device learns about remote revocation only upon reconnecting. If the access requirement includes preventing a previously authorized person from retaining or copying data already delivered to their device, resolve that requirement before choosing a platform.
