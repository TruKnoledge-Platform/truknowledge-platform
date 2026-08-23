  const teacherIds = new Set<string>(
    [
      ...(taught || []).map((row) => row.teacher_id as string | null),
      ...(connected || []).map((row) => row.user_id as string | null),
    ].filter((id): id is string => !!id)
  );