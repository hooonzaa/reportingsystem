namespace WebApplication1.models
{
    public class Report
    {
        public long Id { get; set; }
        public string? Name { get; set; }
        public string? Type { get; set; }
        public string? Severity { get; set; }
        public string? Description { get; set; }
        public string? Timestamp { get; set; }
        public string? User { get; set; }
        public string? Owner { get; set; }
    }
}