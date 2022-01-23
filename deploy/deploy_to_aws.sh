cd ../dist && aws s3 sync . s3://heymate-web-app-dev
aws cloudfront create-invalidation --distribution-id EH90M1G26X6BS --path "/*"
