using System.Collections.Concurrent;
using System.ComponentModel.DataAnnotations;

var builder = WebApplication.CreateBuilder(args);

// Allow CORS from Vite dev server (change origin if needed)
var MyAllowSpecificOrigins = "_myAllowSpecificOrigins";
builder.Services.AddCors(options =>
{
    options.AddPolicy(name: MyAllowSpecificOrigins,
                      policy =>
                      {
                          policy.WithOrigins("http://localhost:5173")
                                .AllowAnyHeader()
                                .AllowAnyMethod();
                      });
});

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

app.UseCors(MyAllowSpecificOrigins);

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.MapGet("/", () => Results.Redirect("/swagger"));

/*
 In-memory store for tasks.
 Task model is defined below.
*/
var store = new TaskStore();

// GET all tasks
app.MapGet("/api/tasks", () =>
{
    return Results.Ok(store.GetAll());
});

// GET single task
app.MapGet("/api/tasks/{id:int}", (int id) =>
{
    var t = store.Get(id);
    return t is not null ? Results.Ok(t) : Results.NotFound();
});

// POST create task
app.MapPost("/api/tasks", (CreateTaskDto dto) =>
{
    if (string.IsNullOrWhiteSpace(dto.Description))
        return Results.BadRequest(new { error = "Description is required." });

    var created = store.Create(dto.Description);
    return Results.Created($"/api/tasks/{created.Id}", created);
});

// PUT toggle completion
app.MapPut("/api/tasks/{id:int}/toggle", (int id) =>
{
    var updated = store.Toggle(id);
    return updated is not null ? Results.Ok(updated) : Results.NotFound();
});

// DELETE task
app.MapDelete("/api/tasks/{id:int}", (int id) =>
{
    var removed = store.Delete(id);
    return removed ? Results.NoContent() : Results.NotFound();
});

// Optional: update description
app.MapPut("/api/tasks/{id:int}", (int id, UpdateTaskDto dto) =>
{
    var updated = store.UpdateDescription(id, dto.Description);
    return updated is not null ? Results.Ok(updated) : Results.NotFound();
});

app.Run();

// ---------------------- Models & Store ----------------------
public record TaskItem(int Id, string Description, bool IsCompleted, DateTime CreatedAt);

public class TaskStore
{
    private readonly ConcurrentDictionary<int, TaskItem> _tasks = new();
    private int _idCounter = 0;

    public IEnumerable<TaskItem> GetAll() => _tasks.Values.OrderBy(t => t.Id);

    public TaskItem? Get(int id) => _tasks.TryGetValue(id, out var t) ? t : null;

    public TaskItem Create(string description)
    {
        var id = System.Threading.Interlocked.Increment(ref _idCounter);
        var item = new TaskItem(id, description, false, DateTime.UtcNow);
        _tasks.TryAdd(id, item);
        return item;
    }

    public TaskItem? Toggle(int id)
    {
        if (!_tasks.TryGetValue(id, out var existing)) return null;
        var toggled = existing with { IsCompleted = !existing.IsCompleted };
        _tasks[id] = toggled;
        return toggled;
    }

    public bool Delete(int id) => _tasks.TryRemove(id, out _);

    public TaskItem? UpdateDescription(int id, string? description)
    {
        if (!_tasks.TryGetValue(id, out var existing)) return null;
        var newDesc = string.IsNullOrWhiteSpace(description) ? existing.Description : description;
        var updated = existing with { Description = newDesc };
        _tasks[id] = updated;
        return updated;
    }
}

public class CreateTaskDto
{
    [Required]
    public string Description { get; set; } = string.Empty;
}

public class UpdateTaskDto
{
    public string? Description { get; set; }
}
