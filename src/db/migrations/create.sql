CREATE table contact (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(100),
    phoneNumber VARCHAR(20),
    linkedId uuid,
    linkPrecedence VARCHAR(20),
    createdAt TIMESTAMPTZ NOT NULL DEFAULT(now()),
    updatedAt TIMESTAMPTZ NOT NULL DEFAULT(now()),
    deletedAt TIMESTAMPTZ DEFAULT NULL
);