# Mentor anonymity policy

Mentor identity is hidden until an active mentorship exists. This is a fixed
programme policy and cannot be changed by an individual mentor.

Before pairing, mentor discovery and public profile responses redact:

- name and username
- email and phone number
- profile picture

Professional matching information remains visible, including title, bio,
location, industries, expertise, availability, and experience.

The API reveals identity only to the mentor themselves or to a participant in
an active mentorship with that mentor. Request, discovery, dashboard, and
public-profile clients consume the same server-projected data, so a client
cannot opt into disclosure or search a hidden mentor by name.

The optional `users.mentorSettings` schema field remains solely so documents
created by earlier deployments continue to validate. Its value is ignored.
The former settings queries, mutation, page, navigation link, and seed variants
have been removed.
