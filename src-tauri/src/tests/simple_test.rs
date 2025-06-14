#[cfg(test)]
mod tests {
    #[test]
    fn test_basic_math() {
        assert_eq!(2 + 2, 4);
    }

    #[test]
    fn test_string_operations() {
        let s = "Hello, Rust!";
        assert!(s.contains("Rust"));
        assert_eq!(s.len(), 12);
    }

    #[tokio::test]
    async fn test_async_operation() {
        let result = async { 42 }.await;
        assert_eq!(result, 42);
    }
}
