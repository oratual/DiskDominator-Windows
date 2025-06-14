use std::path::PathBuf;
use tracing_appender::rolling::{RollingFileAppender, Rotation};
use tracing_subscriber::{fmt, layer::SubscriberExt, util::SubscriberInitExt, EnvFilter};

pub fn init_logging() -> Result<(), Box<dyn std::error::Error>> {
    // Determinar el directorio de logs
    let log_dir = get_log_directory()?;
    std::fs::create_dir_all(&log_dir)?;

    // Crear appender para archivos con rotación diaria
    let file_appender =
        RollingFileAppender::new(Rotation::DAILY, log_dir.clone(), "diskdominator.log");

    // Crear appender para logs de error separados
    let error_appender =
        RollingFileAppender::new(Rotation::DAILY, log_dir, "diskdominator-errors.log");

    // Filtro de nivel de logs desde variable de entorno o default
    let env_filter = EnvFilter::try_from_default_env()
        .unwrap_or_else(|_| EnvFilter::new("disk_dominator=debug,warn"));

    // Configurar el subscriber con múltiples capas
    let subscriber = tracing_subscriber::registry()
        // Capa para consola con formato legible
        .with(
            fmt::layer()
                .with_target(true)
                .with_thread_ids(true)
                .with_file(true)
                .with_line_number(true)
                .pretty(),
        )
        // Capa para archivo con formato JSON para análisis
        .with(
            fmt::layer()
                .json()
                .with_writer(file_appender)
                .with_target(true)
                .with_thread_ids(true)
                .with_file(true)
                .with_line_number(true),
        )
        // Capa para errores en archivo separado
        .with(
            fmt::layer()
                .json()
                .with_writer(error_appender)
        )
        .with(env_filter);

    subscriber.init();

    // Log inicial
    tracing::info!(
        version = env!("CARGO_PKG_VERSION"),
        "DiskDominator starting"
    );

    // Registrar panic handler personalizado
    std::panic::set_hook(Box::new(|panic_info| {
        let backtrace = std::backtrace::Backtrace::capture();

        tracing::error!(
            panic = ?panic_info,
            backtrace = ?backtrace,
            "Application panic"
        );

        // En modo debug, crear un crash report
        #[cfg(debug_assertions)]
        if let Err(e) = create_crash_report(panic_info, &backtrace) {
            eprintln!("Failed to create crash report: {}", e);
        }
    }));

    Ok(())
}

fn get_log_directory() -> Result<PathBuf, Box<dyn std::error::Error>> {
    #[cfg(target_os = "windows")]
    {
        let app_data = std::env::var("LOCALAPPDATA")?;
        Ok(PathBuf::from(app_data).join("DiskDominator").join("logs"))
    }

    #[cfg(not(target_os = "windows"))]
    {
        let home = std::env::var("HOME")?;
        Ok(PathBuf::from(home)
            .join(".local")
            .join("share")
            .join("diskdominator")
            .join("logs"))
    }
}

#[cfg(debug_assertions)]
fn create_crash_report(
    panic_info: &std::panic::PanicInfo,
    backtrace: &std::backtrace::Backtrace,
) -> Result<(), Box<dyn std::error::Error>> {
    use chrono::Local;
    use std::io::Write;

    let crash_dir = get_log_directory()?.join("crashes");
    std::fs::create_dir_all(&crash_dir)?;

    let timestamp = Local::now().format("%Y%m%d_%H%M%S");
    let filename = format!("crash_{}.txt", timestamp);
    let crash_path = crash_dir.join(filename);

    let mut file = std::fs::File::create(&crash_path)?;

    writeln!(file, "DiskDominator Crash Report")?;
    writeln!(file, "========================")?;
    writeln!(file, "Time: {}", Local::now())?;
    writeln!(file, "Version: {}", env!("CARGO_PKG_VERSION"))?;
    writeln!(file)?;
    writeln!(file, "Panic Info:")?;
    writeln!(file, "{}", panic_info)?;
    writeln!(file)?;
    writeln!(file, "Backtrace:")?;
    writeln!(file, "{:?}", backtrace)?;

    // En Windows, abrir el directorio de crashes
    #[cfg(target_os = "windows")]
    {
        let _ = std::process::Command::new("explorer.exe")
            .arg(&crash_dir)
            .spawn();
    }

    Ok(())
}

// Macros para logging contextual
#[macro_export]
macro_rules! log_operation {
    ($op:expr, $($arg:tt)*) => {{
        let span = tracing::info_span!("operation", op = $op);
        let _enter = span.enter();
        tracing::info!($($arg)*);
    }};
}

#[macro_export]
macro_rules! log_error_context {
    ($err:expr, $context:expr) => {{
        tracing::error!(
            error = ?$err,
            context = $context,
            file = file!(),
            line = line!(),
            "Operation failed"
        );
    }};
}
