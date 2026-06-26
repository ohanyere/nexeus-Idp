UPDATE "Service"
SET
  "dockerHubNamespace" = 'kuberpull',
  "dockerImage" = 'kuberpull/' || split_part("dockerImage", '/', 2)
WHERE "dockerHubNamespace" <> 'kuberpull';
