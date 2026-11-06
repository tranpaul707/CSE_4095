# Manual verification and evidence
Use a real configured Supabase instance and deployed app, not demo mode.

1. Instructor login: correct credentials work, wrong credentials fail, logout blocks direct dashboard access.
2. Create a survey with MC and true/false questions, reorder questions/choices, save, refresh; inspect surveys/questions/choices in Supabase.
3. Activate survey A, then B. A must close automatically; at most one active record exists.
4. Scan B's QR on a physical phone. Check readable layout and 44px+ targets. Submit all answers and confirm success.
5. Inspect responses and answers. Refresh the app and verify data remains. Use a second browser for another response.
6. Repeat submission with the same token; it must fail without adding records. Missing answers and choices from another question must fail atomically.
7. Leave a student form open, close the survey, then submit. It must fail. Opening the old QR must not expose results.
8. Check results counts and percentages against stored rows. Download CSV, open in a spreadsheet, and check commas, quotes and formula-like text.
9. Duplicate a survey: new draft/questions/choices, zero responses. Archive the original; results remain available. Deleting requires confirmation and cascades its records.
10. Use anon-key API requests to attempt reading responses/answers, changing surveys, and activating surveys. They must fail. Hidden UI controls alone do not establish security.
11. Tab through each page; check labels, visible focus, dialogs, and numeric chart equivalents. Test mobile and desktop in two browsers.
12. Validate performance on the actual deployment; the 200-student and under-2-second goals require load testing and have not been established by unit tests.

Screenshots for submission: Supabase table list; survey and related questions; stored submissions/answers; application results. Hide credentials and private data. Do not fabricate evidence.
